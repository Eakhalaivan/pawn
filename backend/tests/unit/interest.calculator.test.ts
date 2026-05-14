import { describe, it, expect } from 'vitest';
import { InterestCalculator } from '../../src/modules/pledges/interest.calculator.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('InterestCalculator', () => {
  const principal = new Decimal(10000); // 10,000
  const rate = new Decimal(2); // 2%
  const redemptionPeriodDays = 365;
  const penaltyRate = new Decimal(1); // 1%

  it('calculates monthly interest correctly for 30 days', () => {
    const result = InterestCalculator.calculate({
      principal,
      interestRate: rate,
      interestType: 'MONTHLY',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'), // 30 days
      redemptionPeriodDays,
      penaltyRate,
    });

    // (10000 * 2 * 30) / (100 * 30) = 200
    expect(result.interestAmount.toNumber()).toBe(200);
    expect(result.totalDue.toNumber()).toBe(10200);
  });

  it('calculates annual interest correctly for 365 days', () => {
    const result = InterestCalculator.calculate({
      principal,
      interestRate: rate,
      interestType: 'ANNUAL',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'), // 366 days in 2024, but let's use fixed 365 for math
      redemptionPeriodDays: 400,
      penaltyRate,
    });

    // (10000 * 2 * 366) / (100 * 365) ~= 200.54
    expect(result.interestAmount.toNumber()).toBeCloseTo(200.54, 1);
  });

  it('applies penalty rate after redemption period', () => {
    const result = InterestCalculator.calculate({
      principal,
      interestRate: rate,
      interestType: 'MONTHLY',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-01'), // 60 days
      redemptionPeriodDays: 30, // Overdue by 30 days
      penaltyRate,
    });

    // Base interest: (10000 * 2 * 60) / 3000 = 400
    // Penalty: (10000 * 1 * 30) / 3000 = 100
    expect(result.interestAmount.toNumber()).toBe(400);
    expect(result.penaltyAmount.toNumber()).toBe(100);
    expect(result.totalDue.toNumber()).toBe(10500);
  });

  it('returns 0 for 0-day loans', () => {
    const result = InterestCalculator.calculate({
      principal,
      interestRate: rate,
      interestType: 'DAILY',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-01'),
      redemptionPeriodDays,
      penaltyRate,
    });
    expect(result.interestAmount.toNumber()).toBe(0);
  });
});
