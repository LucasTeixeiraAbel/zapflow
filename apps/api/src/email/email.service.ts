import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface SendEmailPayload {
  toEmail: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConnection(tenantId: string) {
    let connection = await this.prisma.emailConnection.findFirst({
      where: { tenantId },
    });

    if (!connection) {
      connection = await this.prisma.emailConnection.create({
        data: {
          tenantId,
          provider: 'SIMULATED',
          status: 'CONNECTED',
          senderEmail: 'promocoes@zapflow.io',
          senderName: 'ZapFlow Campanhas',
        },
      });
    }

    return connection;
  }

  async updateConnection(
    tenantId: string,
    dto: {
      provider: 'SIMULATED' | 'BREVO';
      senderEmail?: string;
      senderName?: string;
      apiKey?: string;
    },
  ) {
    const current = await this.getConnection(tenantId);

    return this.prisma.emailConnection.update({
      where: { id: current.id },
      data: {
        provider: dto.provider,
        senderEmail: dto.senderEmail || current.senderEmail,
        senderName: dto.senderName || current.senderName,
        apiKeyEncrypted: dto.apiKey !== undefined ? dto.apiKey : current.apiKeyEncrypted,
        status: 'CONNECTED',
      },
    });
  }

  async sendEmail(tenantId: string, payload: SendEmailPayload): Promise<EmailSendResult> {
    const connection = await this.getConnection(tenantId);

    if (connection.provider === 'SIMULATED') {
      return this.sendSimulated(payload);
    } else {
      return this.sendBrevo(connection, payload);
    }
  }

  private async sendSimulated(payload: SendEmailPayload): Promise<EmailSendResult> {
    await new Promise((r) => setTimeout(r, 60));
    const messageId = `email_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.logger.log(`[SIMULATED EMAIL] Enviado para ${payload.toEmail} (${payload.recipientName}) - Assunto: "${payload.subject}"`);
    return {
      success: true,
      messageId,
    };
  }

  private async sendBrevo(connection: any, payload: SendEmailPayload): Promise<EmailSendResult> {
    const apiKey = connection.apiKeyEncrypted;
    if (!apiKey) {
      throw new BadRequestException('Chave de API do Brevo não configurada');
    }

    const senderEmail = connection.senderEmail || 'promocoes@zapflow.io';
    const senderName = connection.senderName || 'ZapFlow';

    try {
      this.logger.log(`[BREVO EMAIL] Enviando para ${payload.toEmail} via Brevo API v3`);

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: payload.toEmail,
              name: payload.recipientName,
            },
          ],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`[BREVO EMAIL] Erro: ${JSON.stringify(data)}`);
        return {
          success: false,
          messageId: '',
          error: data.message || 'Falha no envio via Brevo',
        };
      }

      return {
        success: true,
        messageId: data.messageId || 'brevo_' + Date.now(),
      };
    } catch (err: any) {
      this.logger.error(`Exceção ao chamar Brevo API: ${err.message}`);
      return {
        success: false,
        messageId: '',
        error: err.message,
      };
    }
  }
}
