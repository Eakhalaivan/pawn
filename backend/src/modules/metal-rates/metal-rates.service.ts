import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database.js';
import redis from '../../config/redis.js';
import { SetMetalRateInput, RateHistoryQueryInput } from './metal-rates.schema.js';
import { AppError } from '../../shared/errors/AuthError.js';

export class MetalRatesService {
  private readonly CURRENT_RATES_CACHE_KEY = 'metal_rates:current';
  private readonly LIVE_RATES_CACHE_KEY = 'metal_rates:live';

  /**
   * Gets current metal rates from cache or database.
   */
  async getCurrentRates() {
    const cached = await redis.get(this.CURRENT_RATES_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const [gold, silver] = await Promise.all([
      prisma.metalRate.findFirst({ where: { metalType: 'GOLD' }, orderBy: { effectiveDate: 'desc' } }),
      prisma.metalRate.findFirst({ where: { metalType: 'SILVER' }, orderBy: { effectiveDate: 'desc' } }),
    ]);

    const rates = { gold, silver };
    await redis.setex(this.CURRENT_RATES_CACHE_KEY, 3600, JSON.stringify(rates));
    return rates;
  }

  /**
   * Sets today's metal rate and invalidates cache.
   */
  async setRate(data: SetMetalRateInput, userId: string) {
    const effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : new Date();
    
    const rate = await prisma.metalRate.upsert({
      where: {
        metalType_effectiveDate: {
          metalType: data.metalType,
          effectiveDate,
        },
      },
      update: { ratePerGram: new Decimal(data.ratePerGram) },
      create: {
        metalType: data.metalType,
        ratePerGram: new Decimal(data.ratePerGram),
        effectiveDate,
      },
    });

    // Invalidate cache
    await redis.del(this.CURRENT_RATES_CACHE_KEY);

    // Notify clients via Pub/Sub
    await redis.publish('metal_rates_updated', JSON.stringify(rate));

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tableName: 'metal_rates',
        recordId: rate.id,
        action: 'CREATE',
        newValues: rate as any,
        performedById: userId,
      },
    });

    return rate;
  }

  /**
   * Gets live rates from GoldAPI.io with caching and fallback.
   */
  async getLiveRates() {
    const cached = await redis.get(this.LIVE_RATES_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    try {
      const apiKey = process.env.GOLD_API_KEY;
      if (!apiKey) throw new Error('GOLD_API_KEY missing');

      // Fetch Gold (XAU) and Silver (XAG) in INR
      const [goldRes, silverRes] = await Promise.all([
        fetch('https://www.goldapi.io/api/XAU/INR', { headers: { 'x-access-token': apiKey } }),
        fetch('https://www.goldapi.io/api/XAG/INR', { headers: { 'x-access-token': apiKey } }),
      ]);

      const goldData = await goldRes.json();
      const silverData = await silverRes.json();

      if (goldData.error || silverData.error) throw new Error('GoldAPI error');

      const liveRates = {
        gold: goldData.price_gram_24k,
        silver: silverData.price_gram,
        source: 'GoldAPI.io',
        timestamp: new Date(),
      };

      await redis.setex(this.LIVE_RATES_CACHE_KEY, 21600, JSON.stringify(liveRates)); // 6 hours
      return liveRates;
    } catch (error) {
      console.error('GoldAPI failed, falling back to DB rates:', error);
      const dbRates = await this.getCurrentRates();
      return {
        ...dbRates,
        source: 'Database (Fallback)',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Retrieves historical rates.
   */
  async getHistory(query: RateHistoryQueryInput) {
    const where: any = {};
    if (query.metalType) where.metalType = query.metalType;
    if (query.startDate || query.endDate) {
      where.effectiveDate = {};
      if (query.startDate) where.effectiveDate.gte = new Date(query.startDate);
      if (query.endDate) where.effectiveDate.lte = new Date(query.endDate);
    }

    return await prisma.metalRate.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
      take: 100,
    });
  }
}
