import { Queue, ConnectionOptions } from 'bullmq';
import redis from '../config/redis.js';

const connection: ConnectionOptions = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

export const emailQueue = new Queue('email', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const reportQueue = new Queue('reports', { connection });

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
