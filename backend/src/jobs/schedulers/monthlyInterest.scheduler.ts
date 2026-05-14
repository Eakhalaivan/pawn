import { Queue } from 'bullmq';
import prisma from '../../config/database.js';
import { InterestCalculator } from '../../modules/pledges/interest.calculator.js';
import { emailQueue, notificationQueue, defaultJobOptions } from '../queue.js';
import redis from '../../config/redis.js';

/**
 * Monthly Interest Scheduler
 * Runs on the 1st of every month at 9:00 AM IST.
 */
export async function setupMonthlyInterestScheduler() {
  const schedulerQueue = new Queue('scheduler', {
    connection: {
      host: redis.options.host,
      port: redis.options.port,
      password: redis.options.password,
    },
  });

  // Cron for 1st of every month at 09:00 AM IST
  // IST is UTC+5:30. So 9:00 AM IST is 3:30 AM UTC.
  const cron = '30 3 1 * *'; 

  await schedulerQueue.add(
    'processMonthlyInterest',
    {},
    {
      repeat: { pattern: cron },
      ...defaultJobOptions,
    }
  );

  console.log('Monthly Interest Scheduler set up for 1st of every month at 9:00 AM IST');
}

export async function processMonthlyInterest() {
  const activePledges = await prisma.pledge.findMany({
    where: { status: { in: ['ACTIVE', 'PART_PAID'] } },
    include: { customer: true, scheme: true, transactions: true },
  });

  console.log(`[Scheduler] Processing interest for ${activePledges.length} pledges`);

  for (const pledge of activePledges) {
    const totalPartPayments = pledge.transactions
      .filter(t => t.transactionType === 'PART_PAYMENT')
      .reduce((acc, t) => acc.add(t.amount), new (require('@prisma/client/runtime/library').Decimal)(0));

    const principal = pledge.loanAmount.sub(totalPartPayments);

    const interestData = InterestCalculator.calculate({
      principal,
      interestRate: pledge.interestRate,
      interestType: pledge.interestType as any,
      startDate: pledge.pledgeDate,
      endDate: new Date(),
      redemptionPeriodDays: pledge.scheme.redemptionPeriodDays,
      penaltyRate: pledge.scheme.penaltyRate,
    });

    // 1. Create In-App Notification
    await prisma.notification.create({
      data: {
        customerId: pledge.customerId,
        type: 'INTEREST_REMINDER',
        title: 'Monthly Interest Reminder',
        message: `Interest due for pledge ${pledge.pledgeNumber}: ₹${interestData.interestAmount.toFixed(2)}`,
        pledgeId: pledge.id,
      },
    });

    // 2. Enqueue Email Job
    if (pledge.customer.email) {
      await emailQueue.add('sendInterestReminder', {
        type: 'INTEREST_REMINDER',
        to: pledge.customer.email,
        subject: `Interest Reminder: ${pledge.pledgeNumber}`,
        payload: {
          pledgeNumber: pledge.pledgeNumber,
          interestAmount: interestData.interestAmount,
          totalDue: interestData.totalDue,
        }
      }, defaultJobOptions);
    }

    // 3. Enqueue SMS Job (if overdue)
    if (interestData.interestDays > pledge.scheme.redemptionPeriodDays) {
      await notificationQueue.add('sendSMSReminder', {
        phone: pledge.customer.phone,
        message: `URGENT: Your pledge ${pledge.pledgeNumber} is overdue. Total due: ₹${interestData.totalDue.toFixed(2)}. Please visit branch.`,
      }, defaultJobOptions);
    }
  }
}
