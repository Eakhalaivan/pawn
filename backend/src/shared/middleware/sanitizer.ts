import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from 'fastify';

/**
 * Middleware to sanitize input by stripping HTML tags from string fields.
 */
export function sanitizeInput(request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErrOrRes) {
  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeObject(request.body);
  }
  done();
}

function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = obj[key].replace(/<[^>]*>?/gm, ''); // Basic HTML stripping
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }
  
  return obj;
}
