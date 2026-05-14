import { FastifyInstance } from 'fastify';
import { MetalRatesController } from './metal-rates.controller.js';
import { setMetalRateSchema, rateHistoryQuerySchema } from './metal-rates.schema.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const metalRatesController = new MetalRatesController();

export async function metalRatesRoutes(fastify: FastifyInstance) {
  fastify.get('/current', metalRatesController.getCurrent);

  fastify.get('/history', {
    schema: { querystring: rateHistoryQuerySchema },
    handler: metalRatesController.getHistory,
  });

  fastify.get('/live', {
    preHandler: [authenticate],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    handler: metalRatesController.getLive,
  });

  fastify.post('/', {
    schema: { body: setMetalRateSchema },
    preHandler: [authenticate, authorize(['ADMIN'])],
    handler: metalRatesController.setRate,
  });
}
