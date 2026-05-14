import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/AuthError.js';
import prisma from '../../config/database.js';

/**
 * Middleware to authorize requests based on user roles.
 * @param allowedRoles - Array of roles allowed to access the route.
 */
export function authorize(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;

    if (!user || !user.role) {
      throw new AppError('Unauthorized access', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(user.role)) {
      // Log unauthorized attempt
      try {
        await prisma.auditLog.create({
          data: {
            tableName: 'SECURITY',
            recordId: request.url,
            action: 'DELETE', // Using DELETE as a proxy for 'ACCESS_DENIED' or similar if not explicitly in enum
            newValues: {
              ip: request.ip,
              method: request.method,
              allowedRoles,
              attemptedRole: user.role,
              userId: user.userId
            },
            performedById: user.userId,
          },
        });
      } catch (logError) {
        request.log.error('Failed to log unauthorized access attempt', logError);
      }

      throw new AppError('Forbidden: You do not have permission to perform this action', 403, 'FORBIDDEN');
    }
  };
}
