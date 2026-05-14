import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportsService } from './reports.service.js';
import { reportQueue, defaultJobOptions } from '../../jobs/queue.js';

const reportsService = new ReportsService();

export class ReportsController {
  async getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await reportsService.getDashboardStats();
    return reply.send({ success: true, data: stats });
  }

  async getDailyCollection(request: FastifyRequest<{ Querystring: { from?: string; to?: string; page?: string; limit?: string } }>, reply: FastifyReply) {
    const from = request.query.from ? new Date(request.query.from) : new Date(new Date().setHours(0, 0, 0, 0));
    const to = request.query.to ? new Date(request.query.to) : new Date();
    const page = parseInt(request.query.page || '1');
    const limit = parseInt(request.query.limit || '10');

    const result = await reportsService.getDailyCollection(from, to, page, limit);

    // Handle CSV Export if requested
    if (request.headers.accept === 'text/csv') {
      const csv = this.convertToCSV(result.data);
      return reply.type('text/csv').send(csv);
    }

    return reply.send({ success: true, ...result });
  }

  async getInterestIncome(request: FastifyRequest<{ Querystring: { from?: string; to?: string } }>, reply: FastifyReply) {
    const from = request.query.from ? new Date(request.query.from) : new Date(new Date().getFullYear(), 0, 1);
    const to = request.query.to ? new Date(request.query.to) : new Date();

    const stats = await reportsService.getInterestIncome(from, to);
    return reply.send({ success: true, data: stats });
  }

  async exportReport(request: FastifyRequest<{ Body: { type: string; filters: any } }>, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const job = await reportQueue.add('generateCSV', {
      type: request.body.type,
      filters: request.body.filters,
      userId
    }, defaultJobOptions);

    return reply.send({ success: true, data: { jobId: job.id } });
  }

  async getExportStatus(request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) {
    const job = await reportQueue.getJob(request.params.jobId);
    if (!job) return reply.status(404).send({ success: false, message: 'Job not found' });

    const state = await job.getState();
    const result = job.returnvalue;

    return reply.send({
      success: true,
      data: {
        id: job.id,
        state,
        progress: job.progress,
        downloadUrl: result?.downloadUrl
      }
    });
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    return `${headers}\n${rows}`;
  }
}
