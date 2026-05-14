import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../../config/database.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.get('/audit-logs', {
    preHandler: [authenticate, authorize(['ADMIN'])],
    handler: async (request: FastifyRequest<{ Querystring: { table?: string; recordId?: string; from?: string; to?: string } }>, reply: FastifyReply) => {
      const { table, recordId, from, to } = request.query;

      const where: any = {};
      if (table) where.tableName = table;
      if (recordId) where.recordId = recordId;
      if (from || to) {
        where.performedAt = {};
        if (from) where.performedAt.gte = new Date(from);
        if (to) where.performedAt.lte = new Date(to);
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { performedAt: 'desc' },
        include: { performedBy: { select: { email: true, role: true } } },
        take: 100,
      });

      return reply.send({ success: true, data: logs });
    },
  });
}
