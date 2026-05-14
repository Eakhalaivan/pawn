import { FastifyInstance } from 'fastify';
import { JewelryController } from './jewelry.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const jewelryController = new JewelryController();

export async function jewelryRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.get('/', jewelryController.getAllItems);
  fastify.get('/:id', jewelryController.getItemById);

  // Protected routes (Admin/Manager only)
  fastify.post('/', {
    preHandler: [authenticate, authorize(['ADMIN', 'MANAGER'])],
    handler: jewelryController.createItem
  });

  fastify.put('/:id', {
    preHandler: [authenticate, authorize(['ADMIN', 'MANAGER'])],
    handler: jewelryController.updateItem
  });

  fastify.delete('/:id', {
    preHandler: [authenticate, authorize(['ADMIN', 'MANAGER'])],
    handler: jewelryController.deleteItem
  });
}
