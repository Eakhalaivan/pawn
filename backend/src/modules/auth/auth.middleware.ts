import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { AuthError } from '../../shared/errors/AuthError.js';

/**
 * Middleware to authenticate requests using JWT.
 * Validates the RS256 signed access token.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];
  const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') || '';

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    (request as any).user = decoded;
  } catch (err) {
    throw new AuthError('Invalid or expired token');
  }
}
