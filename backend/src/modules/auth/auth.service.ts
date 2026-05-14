import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schema.js';
import { AuthError } from '../../shared/errors/AuthError.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  /**
   * Registers a new user.
   * Business Rule: Customers can self-register. Admin/Staff by Admin only.
   */
  async register(data: RegisterInput, creatorRole?: string) {
    if (data.role !== 'CUSTOMER' && creatorRole !== 'ADMIN') {
      throw new AuthError('Only admins can create staff or manager accounts');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AuthError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
        },
      });

      if (data.role === 'CUSTOMER') {
        await tx.customer.create({
          data: {
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            address: '', // To be filled later or added to register schema
          },
        });
      }

      return user;
    });
  }

  /**
   * Authenticates a user and returns tokens.
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive) {
      throw new AuthError('Invalid credentials or account inactive');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user.id, user.role, user.email);
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * Business Rule: Rotates refresh token on every use.
   */
  async refresh(oldRefreshToken: string) {
    const hashedToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    const user = await prisma.user.findFirst({ where: { refreshToken: hashedToken } });

    if (!user || !user.isActive) {
      throw new AuthError('Invalid refresh token');
    }

    const accessToken = this.generateAccessToken(user.id, user.role, user.email);
    const newRefreshToken = this.generateRefreshToken();
    const newHashedRefreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashedRefreshToken },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logs out a user by clearing their refresh token.
   */
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Changes user password.
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AuthError('User not found');

    const isPasswordValid = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!isPasswordValid) throw new AuthError('Invalid old password');

    const newPasswordHash = await bcrypt.hash(data.newPassword, this.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash, refreshToken: null }, // Logout all sessions
    });
  }

  private generateAccessToken(userId: string, role: string, email: string): string {
    const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
    return jwt.sign(
      { userId, role, email },
      privateKey,
      { algorithm: 'RS256', expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}
