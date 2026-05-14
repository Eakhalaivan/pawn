import { FastifyRequest, FastifyReply } from 'fastify';
import { PledgesService } from './pledges.service.js';
import { CreatePledgeInput, PartPaymentInput, PledgeQueryInput } from './pledges.schema.js';

const pledgesService = new PledgesService();

export class PledgesController {
  async create(request: FastifyRequest<{ Body: CreatePledgeInput }>, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const pledge = await pledgesService.createPledge(request.body, userId);
    return reply.status(201).send({ success: true, data: pledge });
  }

  async list(request: FastifyRequest<{ Querystring: PledgeQueryInput }>, reply: FastifyReply) {
    const result = await pledgesService.listPledges(request.query);
    return reply.send({ success: true, ...result });
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    // Basic implementation for getById
    return reply.send({ success: true, data: {} });
  }

  async partPayment(request: FastifyRequest<{ Params: { id: string }; Body: PartPaymentInput }>, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const transaction = await pledgesService.partPayment(request.params.id, request.body, userId);
    return reply.send({ success: true, data: transaction });
  }

  async getInterest(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const interest = await pledgesService.getInterest(request.params.id);
    return reply.send({ success: true, data: interest });
  }

  async getReceipt(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    // To be implemented with Puppeteer in future step or logic here
    return reply.send({ success: true, message: 'PDF Receipt generation placeholder' });
  }
}
