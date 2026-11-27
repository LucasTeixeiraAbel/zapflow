import IORedis from 'ioredis';
import { Worker } from 'bullmq';

console.log('ZapFlow Worker starting...');

// Configuração segura usando variáveis de ambiente
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const connection = new IORedis(redisConfig, {
  maxRetriesPerRequest: null,
});

const worker = new Worker('messages', async job => {
  console.log(`Processing job ${job.id}:`, job.data);
  // Aqui virá a lógica de envio via API da Meta
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

console.log('Worker is now listening on "messages" queue');
