import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { AppError } from '../errors/AuthError.js';

/**
 * Global Error Handler for Fastify.
 * Maps custom errors, Prisma errors, and Zod errors to structured responses.
 */
export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  const requestId = request.id;
  let statusCode = error.statusCode || 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = error.message;
  let fields: Record<string, string> | undefined;

  // 1. Handle Zod Validation Errors
  if (error instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    fields = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      fields![path] = err.message;
    });
  }

  // 2. Handle Prisma Database Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'A record with this value already exists';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    }
  }

  // 3. Handle Custom App Errors
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    if ((error as any).fields) {
      fields = (error as any).fields;
    }
  }

  // Log Error (Pino)
  request.log.error({
    err: error,
    requestId,
    user: (request as any).user?.userId,
  });

  // Send to Sentry in Production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setUser({ id: (request as any).user?.userId });
      scope.setTag('requestId', requestId as string);
      Sentry.captureException(error);
    });
  }

  // Send Structured Response
  return reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      fields,
      requestId,
    },
  });
}
