import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log('ZapFlow Worker starting...');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const connection = new IORedis(redisConfig, { maxRetriesPerRequest: null });

const worker = new Worker('messages', async job => {
  console.log(`Processing job ${job.id}:`, job.data);
  const { campaignId, recipientId, contactId, templateId } = job.data;

  try {
    // 1. Simular chamada WhatsApp
    console.log(`Sending template ${templateId} to ${contactId}`);
    
    // 2. Atualizar status no DB
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'SENT' }
    });
  } catch (err) {
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'FAILED' }
    });
    throw err;
  }
}, { connection });

worker.on('completed', job => console.log(`Job ${job.id} done`));
console.log('Worker listening on "messages" queue');
