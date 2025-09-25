import { Job, Worker } from 'bullmq';
import { SendEmail } from '../../utils/nodemailer';
import { redisConnection } from '../../config/redisConfig';
import { getConfig } from '../../config/config';
import { emailQueue } from './queue';

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: Record<string, any>;
}

const config = getConfig();
const emailWorker = new Worker(
  'email',
  async (job: Job<EmailJobData>) => {
    const { to, subject, body, template, data } = job.data;

    try {
      await SendEmail({
        to,
        subject: subject,
        html: body,
        text: body,
      });

      console.log(`Email sent successfully to to ${to}`);
      return { success: true, recipient: to };
    } catch (error: any) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: config.bullmq.concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

emailWorker.on('progress', (job, progress) => {
  console.log(`Email job ${job.id} progress: ${progress}%`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down email worker...');
  await emailWorker.close();
  await emailQueue.close();
  await redisConnection.quit();
});

export { emailWorker };
