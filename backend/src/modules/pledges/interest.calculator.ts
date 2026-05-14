import { Decimal } from '@prisma/client/runtime/library';

export interface InterestCalculationResult {
  principal: Decimal;
  interestDays: number;
  interestAmount: Decimal;
  penaltyAmount: Decimal;
  totalDue: Decimal;
  breakdown: {
    days: number;
    rate: number;
    type: string;
    isPenalty: boolean;
  }[];
}

export class InterestCalculator {
  /**
   * Calculates interest based on principal, rate, dates, and payments.
   * Business Rules:
   * - Monthly: principal × rate × days / (100 × 30)
   * - Annual: principal × rate × days / (100 × 365)
   * - Daily: principal × rate × days / 100
   */
  static calculate(params: {
    principal: Decimal;
    interestRate: Decimal;
    interestType: 'MONTHLY' | 'ANNUAL' | 'DAILY';
    startDate: Date;
    endDate: Date;
    redemptionPeriodDays: number;
    penaltyRate: Decimal;
  }): InterestCalculationResult {
    const { principal, interestRate, interestType, startDate, endDate, redemptionPeriodDays, penaltyRate } = params;
    
    const diffTime = Math.max(0, endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let divisor = 100;
    if (interestType === 'MONTHLY') divisor = 100 * 30;
    if (interestType === 'ANNUAL') divisor = 100 * 365;
    if (interestType === 'DAILY') divisor = 100;

    const baseInterest = principal.mul(interestRate).mul(totalDays).div(divisor);
    
    let penaltyAmount = new Decimal(0);
    if (totalDays > redemptionPeriodDays) {
      const penaltyDays = totalDays - redemptionPeriodDays;
      penaltyAmount = principal.mul(penaltyRate).mul(penaltyDays).div(divisor);
    }

    const totalDue = principal.add(baseInterest).add(penaltyAmount);

    return {
      principal,
      interestDays: totalDays,
      interestAmount: baseInterest,
      penaltyAmount,
      totalDue,
      breakdown: [
        {
          days: totalDays,
          rate: interestRate.toNumber(),
          type: interestType,
          isPenalty: false
        },
        {
          days: Math.max(0, totalDays - redemptionPeriodDays),
          rate: penaltyRate.toNumber(),
          type: interestType,
          isPenalty: true
        }
      ]
    };
  }
}
