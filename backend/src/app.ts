import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import multipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import redis from './config/redis.js';
import { sanitizeInput } from './shared/middleware/sanitizer.js';
import { errorHandler } from './shared/middleware/errorHandler.js';

// Module Routes
import { authRoutes } from './modules/auth/auth.routes.js';
import { pledgeRoutes } from './modules/pledges/pledges.routes.js';
import { metalRatesRoutes } from './modules/metal-rates/metal-rates.routes.js';
import { reportRoutes } from './modules/reports/reports.routes.js';
import { paymentRoutes } from './modules/payments/payments.routes.js';
import { jewelryRoutes } from './modules/jewelry/jewelry.routes.js';

const createApp = (): FastifyInstance => {
  const app = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register plugins
  app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
      },
    },
  });
  app.register(sensible);
  app.register(multipart);
  app.register(cookie);
  
  // Rate Limiting
  app.register(rateLimit, {
    global: true,
    max: (req: any) => (req.user ? 200 : 30),
    timeWindow: '1 minute',
    redis: redis as any,
    keyGenerator: (req) => {
      const user = (req as any).user;
      return user ? `user:${user.userId}` : req.ip;
    },
    errorResponseBuilder: (req, context) => ({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${context.after}`,
        requestId: req.id
      }
    })
  });

  app.addHook('preValidation', sanitizeInput);
  app.setErrorHandler(errorHandler);

  // Basic health check
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // Root route
  app.get('/', async () => {
    return { message: 'Jewelry Pawnshop API' };
  });

  // API Routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(pledgeRoutes, { prefix: '/api/v1/pledges' });
  app.register(metalRatesRoutes, { prefix: '/api/v1/metal-rates' });
  app.register(reportRoutes, { prefix: '/api/v1/reports' });
  app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  app.register(jewelryRoutes, { prefix: '/api/v1/jewelry' });

  return app;
};

export default createApp;
