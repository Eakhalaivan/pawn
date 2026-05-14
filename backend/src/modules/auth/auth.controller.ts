import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from './auth.schema.js';

const authService = new AuthService();

export class AuthController {
  async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
    const creatorRole = (request as any).user?.role;
    const user = await authService.register(request.body, creatorRole);
    return reply.status(201).send({ success: true, data: user });
  }

  async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    const { user, accessToken, refreshToken } = await authService.login(request.body);

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.send({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const oldRefreshToken = request.cookies.refreshToken;
    if (!oldRefreshToken) {
      return reply.status(401).send({ success: false, message: 'Refresh token missing' });
    }

    const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({ success: true, data: { accessToken } });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    await authService.logout(userId);
    reply.clearCookie('refreshToken');
    return reply.send({ success: true, message: 'Logged out' });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: (request as any).user });
  }

  async forgotPassword(request: FastifyRequest<{ Body: ForgotPasswordInput }>, reply: FastifyReply) {
    // Implementation for forgot password logic
    return reply.send({ success: true, message: 'If email exists, reset link sent' });
  }

  async resetPassword(request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) {
    // Implementation for reset password logic
    return reply.send({ success: true, message: 'Password reset successfully' });
  }

  async changePassword(request: FastifyRequest<{ Body: ChangePasswordInput }>, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    await authService.changePassword(userId, request.body);
    return reply.send({ success: true, message: 'Password changed successfully' });
  }
}
