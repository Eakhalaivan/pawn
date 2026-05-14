import { FastifyInstance } from 'fastify';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const reportsController = new ReportsController();

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', authorize(['ADMIN', 'MANAGER']));

  fastify.get('/dashboard-stats', reportsController.getDashboardStats);
  fastify.get('/daily-collection', reportsController.getDailyCollection);
  fastify.get('/interest-income', reportsController.getInterestIncome);
  
  fastify.post('/export', reportsController.exportReport);
  fastify.get('/export/:jobId', reportsController.getExportStatus);
}
