import { FastifyReply, FastifyRequest } from 'fastify';
import { JewelryService } from './jewelry.service.js';

const jewelryService = new JewelryService();

export class JewelryController {
  async getAllItems(request: FastifyRequest, reply: FastifyReply) {
    try {
      const items = await jewelryService.getAllItems();
      return reply.send({ success: true, data: items });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch jewelry items' });
    }
  }

  async getItemById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const item = await jewelryService.getItemById(id);
      if (!item) return reply.status(404).send({ success: false, error: 'Item not found' });
      return reply.send({ success: true, data: item });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to fetch jewelry item' });
    }
  }

  async createItem(request: FastifyRequest, reply: FastifyReply) {
    try {
      const item = await jewelryService.createItem(request.body);
      return reply.status(21).send({ success: true, data: item });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to create jewelry item' });
    }
  }

  async updateItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const item = await jewelryService.updateItem(id, request.body);
      return reply.send({ success: true, data: item });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to update jewelry item' });
    }
  }

  async deleteItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await jewelryService.deleteItem(id);
      return reply.send({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to delete jewelry item' });
    }
  }
}
