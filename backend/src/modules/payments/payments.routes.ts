import { FastifyInstance } from 'fastify';
import { PaymentsController } from './payments.controller.js';
import { createPaymentIntentSchema } from './payments.schema.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

const paymentsController = new PaymentsController();

export async function paymentRoutes(fastify: FastifyInstance) {
  // Webhook must be public and handle raw body
  fastify.post('/webhook', {
    config: { rawBody: true }, // Signal that we need raw body if using a plugin like fastify-raw-body
    handler: paymentsController.webhook,
  });

  fastify.post('/create-intent', {
    preHandler: [authenticate],
    schema: { body: createPaymentIntentSchema },
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 hour',
      },
    },
    handler: paymentsController.createIntent,
  });

  fastify.get('/orders/:id', {
    preHandler: [authenticate],
    handler: paymentsController.getOrder,
  });
}
