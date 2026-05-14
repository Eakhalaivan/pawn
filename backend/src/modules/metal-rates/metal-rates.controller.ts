import { FastifyRequest, FastifyReply } from 'fastify';
import { MetalRatesService } from './metal-rates.service.js';
import { SetMetalRateInput, RateHistoryQueryInput } from './metal-rates.schema.js';

const metalRatesService = new MetalRatesService();

export class MetalRatesController {
  async getCurrent(request: FastifyRequest, reply: FastifyReply) {
    const rates = await metalRatesService.getCurrentRates();
    return reply.send({ success: true, data: rates });
  }

  async getLive(request: FastifyRequest, reply: FastifyReply) {
    const rates = await metalRatesService.getLiveRates();
    return reply.send({ success: true, data: rates });
  }

  async getHistory(request: FastifyRequest<{ Querystring: RateHistoryQueryInput }>, reply: FastifyReply) {
    const history = await metalRatesService.getHistory(request.query);
    return reply.send({ success: true, data: history });
  }

  async setRate(request: FastifyRequest<{ Body: SetMetalRateInput }>, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const rate = await metalRatesService.setRate(request.body, userId);
    return reply.send({ success: true, data: rate });
  }
}
