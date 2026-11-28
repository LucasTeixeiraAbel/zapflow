import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log('[Worker] ZapFlow Worker inicializado...');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'messages',
  async (job) => {
    const { campaignId, recipientId, contactId, phone, contactName, templateName } = job.data;
    console.log(`[Worker] Processando job ${job.id}: ${recipientId} (${phone})`);

    // 1. Revalidação de opt-out
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact || contact.consentStatus === 'OPT_OUT') {
      console.warn(`[Worker] Envio ignorado para ${phone}: Contato revogou consentimento.`);
      await prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'FAILED',
          errorReason: 'Opt-Out: contato na lista de supressão',
        },
      });
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });
      return;
    }

    // 2. Simulação ou envio
    const wamid = 'wamid.' + Buffer.from(`worker_${Date.now()}_${phone}`).toString('base64');
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        externalMessageId: wamid,
      },
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { sentCount: { increment: 1 } },
    });

    // Simula entrega rápida
    setTimeout(async () => {
      try {
        await prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: { status: 'DELIVERED', deliveredAt: new Date() },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { deliveredCount: { increment: 1 } },
        });
      } catch {}
    }, 2000);
  },
  { connection, concurrency: 5 },
);

worker.on('ready', () => {
  console.log('[Worker] Conectado e escutando a fila "messages".');
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou:`, err.message);
});
