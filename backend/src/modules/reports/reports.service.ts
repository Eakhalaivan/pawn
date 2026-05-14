import prisma from '../../config/database.js';
import { Decimal } from '@prisma/client/runtime/library';

export class ReportsService {
  /**
   * Gets dashboard overview statistics.
   */
  async getDashboardStats() {
    const [
      activePledgesCount,
      totalLoanAmount,
      totalCustomers,
      todayCollection
    ] = await Promise.all([
      prisma.pledge.count({ where: { status: 'ACTIVE' } }),
      prisma.pledge.aggregate({
        where: { status: { in: ['ACTIVE', 'PART_PAID'] } },
        _sum: { loanAmount: true }
      }),
      prisma.customer.count(),
      prisma.transaction.aggregate({
        where: {
          transactionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          transactionType: { in: ['PART_PAYMENT', 'INTEREST_PAYMENT'] }
        },
        _sum: { amount: true }
      })
    ]);

    return {
      activePledges: activePledgesCount,
      totalOutstandings: totalLoanAmount._sum.loanAmount || 0,
      totalCustomers,
      todayCollection: todayCollection._sum.amount || 0
    };
  }

  /**
   * Gets daily collection report.
   */
  async getDailyCollection(from: Date, to: Date, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      transactionDate: { gte: from, lte: to },
      transactionType: { in: ['PART_PAYMENT', 'INTEREST_PAYMENT'] }
    };

    const [total, data] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: { pledge: { select: { pledgeNumber: true, customer: { select: { fullName: true } } } } }
      })
    ]);

    return { total, page, limit, data };
  }

  /**
   * Gets interest income report.
   */
  async getInterestIncome(from: Date, to: Date) {
    const income = await prisma.transaction.aggregate({
      where: {
        transactionDate: { gte: from, lte: to },
        transactionType: 'INTEREST_PAYMENT'
      },
      _sum: { amount: true }
    });

    return {
      totalInterestIncome: income._sum.amount || 0,
      period: { from, to }
    };
  }
}
