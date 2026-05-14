import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentIntentInput } from './payments.schema.js';

const paymentsService = new PaymentsService();

export class PaymentsController {
  async createIntent(request: FastifyRequest<{ Body: CreatePaymentIntentInput }>, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const result = await paymentsService.createPaymentIntent(request.body.orderId, userId);
    return reply.send({ success: true, data: result });
  }

  async webhook(request: FastifyRequest, reply: FastifyReply) {
    const signature = request.headers['stripe-signature'] as string;
    // request.rawBody is provided by @fastify/multipart or a custom parser if configured
    // Fastify usually requires a plugin for raw body on specific routes
    const result = await paymentsService.handleWebhook(request.body as any, signature);
    return reply.send(result);
  }

  async getOrder(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    // Basic order retrieval
    return reply.send({ success: true, data: {} });
  }
}
