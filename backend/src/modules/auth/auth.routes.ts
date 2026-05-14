import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema.js';
import { authenticate } from './auth.middleware.js';

const authController = new AuthController();

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', {
    schema: { body: registerSchema },
    handler: authController.register,
  });

  fastify.post('/login', {
    schema: { body: loginSchema },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
    handler: authController.login,
  });

  fastify.post('/refresh', authController.refresh);

  fastify.post('/logout', {
    preHandler: [authenticate],
    handler: authController.logout,
  });

  fastify.get('/me', {
    preHandler: [authenticate],
    handler: authController.me,
  });

  fastify.post('/forgot-password', {
    schema: { body: forgotPasswordSchema },
    handler: authController.forgotPassword,
  });

  fastify.post('/reset-password', {
    schema: { body: resetPasswordSchema },
    handler: authController.resetPassword,
  });

  fastify.post('/change-password', {
    preHandler: [authenticate],
    schema: { body: changePasswordSchema },
    handler: authController.changePassword,
  });
}
