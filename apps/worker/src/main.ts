import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log('ZapFlow Worker starting...');

// Conexão simplificada
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const worker = new Worker('messages', async job => {
  console.log(`Processing job ${job.id}:`, job.data);
  const { recipientId } = job.data;
  
  await prisma.campaignRecipient.update({
    where: { id: recipientId },
    data: { status: 'SENT' }
  });
}, { connection });

console.log('Worker listening on "messages" queue');
