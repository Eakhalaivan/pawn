import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database.js';
import { CreatePledgeInput, PartPaymentInput, PledgeQueryInput } from './pledges.schema.js';
import { AppError, NotFoundError } from '../../shared/errors/AuthError.js';
import { InterestCalculator } from './interest.calculator.js';

export class PledgesService {
  /**
   * Creates a new pledge.
   * Business Rules: Validate entities, generate atomic pledge number, transactional insert, log audit.
   */
  async createPledge(data: CreatePledgeInput, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validations
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw new NotFoundError('Customer not found');
      if (customer.isBlocked) throw new AppError(`Customer is blocked: ${customer.blockReason}`, 403);

      const scheme = await tx.scheme.findUnique({ where: { id: data.schemeId } });
      if (!scheme || !scheme.isActive) throw new AppError('Scheme not found or inactive', 400);

      const loanType = await tx.loanType.findUnique({ where: { id: data.loanTypeId } });
      if (!loanType || !loanType.isActive) throw new AppError('Loan type not found or inactive', 400);

      // 2. Atomic Pledge Number Generation
      const now = new Date();
      const monthYear = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prefix = `PL-${monthYear}-`;
      
      const lastPledge = await tx.pledge.findFirst({
        where: { pledgeNumber: { startsWith: prefix } },
        orderBy: { pledgeNumber: 'desc' },
      });

      let sequence = 1;
      if (lastPledge) {
        const lastSeq = parseInt(lastPledge.pledgeNumber.split('-')[2]);
        sequence = lastSeq + 1;
      }
      const pledgeNumber = `${prefix}${String(sequence).padStart(5, '0')}`;

      // 3. Totals
      const totalWeight = data.items.reduce((acc, item) => acc + item.grossWeightGrams, 0);
      const totalItems = data.items.reduce((acc, item) => acc + item.quantity, 0);

      // 4. Create Pledge
      const pledge = await tx.pledge.create({
        data: {
          pledgeNumber,
          customerId: data.customerId,
          schemeId: data.schemeId,
          loanTypeId: data.loanTypeId,
          loanAmount: new Decimal(data.loanAmount),
          interestRate: scheme.interestRate,
          interestType: scheme.interestType,
          documentCharges: new Decimal(data.documentCharges),
          totalWeightGrams: new Decimal(totalWeight),
          totalItems,
          notes: data.notes,
          createdById: userId,
          items: {
            create: data.items.map(item => ({
              jewelleryTypeId: item.jewelleryTypeId,
              itemDescription: item.itemDescription,
              grossWeightGrams: new Decimal(item.grossWeightGrams),
              netWeightGrams: new Decimal(item.netWeightGrams),
              purity: item.purity,
              quantity: item.quantity,
              itemValue: new Decimal(item.itemValue),
            })),
          },
        },
        include: { items: true },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          tableName: 'pledges',
          recordId: pledge.id,
          action: 'CREATE',
          newValues: pledge as any,
          performedById: userId,
        },
      });

      // 6. Notification (to be enqueued in real worker later)
      await tx.notification.create({
        data: {
          customerId: data.customerId,
          type: 'PLEDGE_CREATED',
          title: 'New Pledge Created',
          message: `Your pledge ${pledgeNumber} for ₹${data.loanAmount} has been created.`,
          pledgeId: pledge.id,
        },
      });

      return pledge;
    });
  }

  /**
   * Retrieves paginated pledges with filters.
   */
  async listPledges(query: PledgeQueryInput) {
    const { status, customerId, startDate, endDate, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.pledgeDate = {};
      if (startDate) where.pledgeDate.gte = new Date(startDate);
      if (endDate) where.pledgeDate.lte = new Date(endDate);
    }

    const [total, data] = await Promise.all([
      prisma.pledge.count({ where }),
      prisma.pledge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { pledgeDate: 'desc' },
        include: { customer: true, scheme: true },
      }),
    ]);

    return { total, page, limit, data };
  }

  /**
   * Records a part payment for a pledge.
   */
  async partPayment(pledgeId: string, data: PartPaymentInput, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const pledge = await tx.pledge.findUnique({
        where: { id: pledgeId },
        include: { transactions: true }
      });
      if (!pledge) throw new NotFoundError('Pledge not found');
      if (pledge.status === 'REDEEMED' || pledge.status === 'CANCELLED') {
        throw new AppError('Cannot pay on closed pledge', 400);
      }

      // Calculate balance
      const totalPaid = pledge.transactions
        .filter(t => t.transactionType === 'PART_PAYMENT')
        .reduce((acc, t) => acc.add(t.amount), new Decimal(0));
      
      const balance = pledge.loanAmount.sub(totalPaid);
      if (new Decimal(data.amount).gt(balance)) {
        throw new AppError('Payment exceeds outstanding principal', 400);
      }

      const transaction = await tx.transaction.create({
        data: {
          pledgeId,
          transactionType: 'PART_PAYMENT',
          amount: new Decimal(data.amount),
          paymentMode: data.paymentMode,
          notes: data.notes,
          createdById: userId,
        },
      });

      await tx.pledge.update({
        where: { id: pledgeId },
        data: { status: 'PART_PAID' },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'transactions',
          recordId: transaction.id,
          action: 'CREATE',
          newValues: transaction as any,
          performedById: userId,
        },
      });

      return transaction;
    });
  }

  /**
   * Calculates interest due for a pledge.
   */
  async getInterest(pledgeId: string) {
    const pledge = await prisma.pledge.findUnique({
      where: { id: pledgeId },
      include: { scheme: true, transactions: true }
    });
    if (!pledge) throw new NotFoundError('Pledge not found');

    const totalPartPayments = pledge.transactions
      .filter(t => t.transactionType === 'PART_PAYMENT')
      .reduce((acc, t) => acc.add(t.amount), new Decimal(0));

    const principal = pledge.loanAmount.sub(totalPartPayments);

    return InterestCalculator.calculate({
      principal,
      interestRate: pledge.interestRate,
      interestType: pledge.interestType as any,
      startDate: pledge.pledgeDate,
      endDate: new Date(),
      redemptionPeriodDays: pledge.scheme.redemptionPeriodDays,
      penaltyRate: pledge.scheme.penaltyRate,
    });
  }
}
