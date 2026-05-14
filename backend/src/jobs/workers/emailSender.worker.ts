import { Worker, Job } from 'bullmq';
import { Resend } from 'resend';
import redis from '../../config/redis.js';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailJobData {
  type: 'ORDER_CONFIRMATION' | 'PLEDGE_CREATED' | 'INTEREST_REMINDER' | 'PASSWORD_RESET';
  to: string;
  subject: string;
  payload: any;
}

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { to, subject, payload, type } = job.data;
    
    console.log(`[EmailWorker] Processing job ${job.id} for ${to} (${type})`);

    try {
      await resend.emails.send({
        from: 'Pawnshop <noreply@yourdomain.com>',
        to: [to],
        subject: subject,
        html: `<h1>${subject}</h1><p>${JSON.stringify(payload)}</p>`, // Simplified for now
      });
      
      console.log(`[EmailWorker] Successfully sent email to ${to}`);
    } catch (error) {
      console.error(`[EmailWorker] Failed to send email to ${to}`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: {
      host: redis.options.host,
      port: redis.options.port,
      password: redis.options.password,
    },
  }
);
