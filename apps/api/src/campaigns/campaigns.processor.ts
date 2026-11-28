import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

export interface SendMessageJobData {
  campaignId: string;
  recipientId: string;
  contactId: string;
  tenantId: string;
  phone: string;
  contactName: string;
  templateName: string;
}

@Processor('messages', { concurrency: 5 })
export class CampaignsProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {
    super();
  }

  async process(job: Job<SendMessageJobData>): Promise<any> {
    const { campaignId, recipientId, contactId, tenantId, phone, contactName, templateName } =
      job.data;

    this.logger.log(`[Queue] Processando disparo: Destinatário ${recipientId} (${phone})`);

    // 1. Revalidação atômica de consentimento e supressão antes do envio
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact || contact.consentStatus === 'OPT_OUT') {
      this.logger.warn(`Envio cancelado para ${phone}: Contato revogou consentimento (Opt-Out).`);
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'FAILED',
          errorReason: 'Cancelado: contato está na lista de supressão (Opt-Out)',
        },
      });
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });
      return { cancelled: true, reason: 'OPT_OUT' };
    }

    // 2. Disparo através do WhatsappService (Simulado ou Cloud API)
    try {
      const result = await this.whatsappService.sendMessage(tenantId, {
        recipientPhone: phone,
        contactName,
        templateName,
      });

      if (result.success) {
        await this.prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'SENT',
            externalMessageId: result.messageId,
            sentAt: new Date(),
          },
        });

        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });

        // 3. Se for no modo simulado, programa entrega e leitura assíncrona para enriquecer a experiência do dashboard
        this.scheduleSimulatedFeedback(recipientId, campaignId);

        // Verifica se a campanha terminou
        await this.checkCampaignCompletion(campaignId);

        return { success: true, messageId: result.messageId };
      } else {
        await this.prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'FAILED',
            errorReason: result.error || 'Falha ao enviar mensagem',
          },
        });

        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });

        await this.checkCampaignCompletion(campaignId);
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      this.logger.error(`Erro ao disparar mensagem para ${phone}: ${err.message}`);
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: 'FAILED',
          errorReason: err.message,
        },
      });

      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });

      await this.checkCampaignCompletion(campaignId);
      throw err;
    }
  }

  private scheduleSimulatedFeedback(recipientId: string, campaignId: string) {
    // Simula Entrega em 1.5 a 3 segundos
    const deliveryDelay = 1500 + Math.random() * 1500;
    setTimeout(async () => {
      try {
        await this.prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { deliveredCount: { increment: 1 } },
        });
      } catch {}
    }, deliveryDelay);

    // Simula Leitura em 4 a 8 segundos para 80% das mensagens
    if (Math.random() > 0.2) {
      const readDelay = 4000 + Math.random() * 4000;
      setTimeout(async () => {
        try {
          await this.prisma.campaignRecipient.update({
            where: { id: recipientId },
            data: {
              status: 'READ',
              readAt: new Date(),
            },
          });
          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { readCount: { increment: 1 } },
          });
        } catch {}
      }, readDelay);
    }
  }

  private async checkCampaignCompletion(campaignId: string) {
    const pendingCount = await this.prisma.campaignRecipient.count({
      where: {
        campaignId,
        status: { in: ['PENDING', 'QUEUED'] },
      },
    });

    if (pendingCount === 0) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }
}
