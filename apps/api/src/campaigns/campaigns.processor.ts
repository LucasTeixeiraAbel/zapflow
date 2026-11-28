import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';

export interface SendMessageJobData {
  campaignId: string;
  recipientId: string;
  contactId: string;
  tenantId: string;
  phone: string;
  email?: string;
  contactName: string;
  templateName: string;
  channel?: 'WHATSAPP' | 'EMAIL';
  emailSubject?: string;
}

@Processor('messages', { concurrency: 5 })
export class CampaignsProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<SendMessageJobData>): Promise<any> {
    const {
      campaignId,
      recipientId,
      contactId,
      tenantId,
      phone,
      email,
      contactName,
      templateName,
      channel = 'WHATSAPP',
      emailSubject,
    } = job.data;

    this.logger.log(`[Queue] Processando disparo (${channel}): Destinatário ${recipientId} (${phone || email})`);

    // 1. Revalidação atômica de consentimento e supressão antes do envio
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact || contact.consentStatus === 'OPT_OUT') {
      this.logger.warn(`Envio cancelado para ${phone || email}: Contato revogou consentimento.`);
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

    // 2. Disparo conforme o Canal (WHATSAPP ou EMAIL)
    try {
      let sendResult: { success: boolean; messageId: string; error?: string };

      if (channel === 'EMAIL') {
        if (!email && !contact.email) {
          throw new Error('Contato não possui e-mail cadastrado');
        }
        const targetEmail = email || contact.email!;
        sendResult = await this.emailService.sendEmail(tenantId, {
          toEmail: targetEmail,
          recipientName: contactName,
          subject: emailSubject || 'Comunicado Especial ZapFlow',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 16px;">
              <h2 style="color: #059669; margin-top: 0;">⚡ ${emailSubject || 'Oferta Especial'}</h2>
              <p>Olá, <strong>${contactName}</strong>!</p>
              <p>Temos uma condição exclusiva preparada especialmente para você hoje.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 15px;">Aproveite enquanto durar o estoque ou responda a este e-mail para falar com nosso time.</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                Você recebeu esta comunicação porque optou por receber atualizações. Para revogar seu consentimento, responda SAIR.
              </p>
            </div>
          `,
        });
      } else {
        sendResult = await this.whatsappService.sendMessage(tenantId, {
          recipientPhone: phone,
          contactName,
          templateName,
        });
      }

      if (sendResult.success) {
        await this.prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'SENT',
            externalMessageId: sendResult.messageId,
            sentAt: new Date(),
          },
        });

        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });

        this.scheduleSimulatedFeedback(recipientId, campaignId);
        await this.checkCampaignCompletion(campaignId);

        return { success: true, messageId: sendResult.messageId };
      } else {
        await this.prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: 'FAILED',
            errorReason: sendResult.error || 'Falha ao enviar mensagem',
          },
        });

        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });

        await this.checkCampaignCompletion(campaignId);
        return { success: false, error: sendResult.error };
      }
    } catch (err: any) {
      this.logger.error(`Erro ao disparar mensagem para ${phone || email}: ${err.message}`);
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
