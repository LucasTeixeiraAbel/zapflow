console.log('ZapFlow Worker starting...');
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker('messages', async job => {
  console.log('Processing job:', job.id, job.data);
}, { connection });

console.log('Worker listening on "messages" queue');
