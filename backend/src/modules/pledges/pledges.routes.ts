import { FastifyInstance } from 'fastify';
import { PledgesController } from './pledges.controller.js';
import { createPledgeSchema, partPaymentSchema, pledgeQuerySchema } from './pledges.schema.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const pledgesController = new PledgesController();

export async function pledgeRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    schema: { querystring: pledgeQuerySchema },
    preHandler: [authorize(['ADMIN', 'MANAGER', 'STAFF'])],
    handler: pledgesController.list,
  });

  fastify.get('/:id', {
    preHandler: [authorize(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'])],
    handler: pledgesController.getById,
  });

  fastify.post('/', {
    schema: { body: createPledgeSchema },
    preHandler: [authorize(['ADMIN', 'MANAGER', 'STAFF'])],
    handler: pledgesController.create,
  });

  fastify.post('/:id/part-payment', {
    schema: { body: partPaymentSchema },
    preHandler: [authorize(['ADMIN', 'MANAGER', 'STAFF'])],
    handler: pledgesController.partPayment,
  });

  fastify.get('/:id/interest', {
    preHandler: [authorize(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'])],
    handler: pledgesController.getInterest,
  });

  fastify.get('/:id/receipt', {
    preHandler: [authorize(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'])],
    handler: pledgesController.getReceipt,
  });
}
