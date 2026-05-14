import { PrismaClient } from '@prisma/client';
import { MetalType } from '@prisma/client';

const prisma = new PrismaClient();

export class JewelryService {
  async getAllItems() {
    return prisma.jewelryItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getItemById(id: string) {
    return prisma.jewelryItem.findUnique({
      where: { id },
    });
  }

  async createItem(data: any) {
    return prisma.jewelryItem.create({
      data: {
        ...data,
        price: Number(data.price),
        weightGrams: Number(data.weightGrams),
        wastagePercent: Number(data.wastagePercent),
      },
    });
  }

  async updateItem(id: string, data: any) {
    return prisma.jewelryItem.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? Number(data.price) : undefined,
        weightGrams: data.weightGrams ? Number(data.weightGrams) : undefined,
        wastagePercent: data.wastagePercent ? Number(data.wastagePercent) : undefined,
      },
    });
  }

  async deleteItem(id: string) {
    return prisma.jewelryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
