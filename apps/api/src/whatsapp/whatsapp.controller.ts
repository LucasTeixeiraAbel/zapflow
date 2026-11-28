import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('connection')
  async getConnection(@CurrentTenant() tenantId: string) {
    return this.whatsappService.getConnection(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('connection')
  async updateConnection(
    @CurrentTenant() tenantId: string,
    @Body()
    dto: {
      provider: 'SIMULATED' | 'CLOUD_API' | 'EVOLUTION_API';
      phoneNumberId?: string;
      wabaId?: string;
      displayPhoneNumber?: string;
      displayName?: string;
      accessToken?: string;
    },
  ) {
    return this.whatsappService.updateConnection(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('templates')
  async getTemplates() {
    return this.whatsappService.getAvailableTemplates();
  }

  @UseGuards(JwtAuthGuard)
  @Post('evolution/qrcode')
  async getEvolutionQrCode(
    @CurrentTenant() tenantId: string,
    @Body()
    dto: {
      apiUrl: string;
      instanceName: string;
      apiKey: string;
    },
  ) {
    return this.whatsappService.getEvolutionQrCode(tenantId, dto);
  }

  // Webhook da Meta: Validação de Token de Verificação
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'zapflow_verify_token_2026';
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    return 'Invalid verify token';
  }

  // Webhook da Meta: Recebimento de Eventos (Status e Mensagens Inbound)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any) {
    this.logger.log(`Webhook recebido: ${JSON.stringify(body)}`);

    try {
      // Salva log de auditoria
      await this.prisma.webhookLog.create({
        data: {
          eventType: body?.entry?.[0]?.changes?.[0]?.field || 'unknown',
          payload: JSON.stringify(body),
        },
      });

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      // 1. Tratamento de atualizações de Status (sent, delivered, read, failed)
      if (changes?.statuses && Array.isArray(changes.statuses)) {
        for (const statusObj of changes.statuses) {
          const wamid = statusObj.id;
          const status = statusObj.status?.toUpperCase(); // DELIVERED, READ, FAILED

          if (wamid && status) {
            const recipient = await this.prisma.campaignRecipient.findFirst({
              where: { externalMessageId: wamid },
            });

            if (recipient) {
              const updateData: any = { status };
              if (status === 'DELIVERED') updateData.deliveredAt = new Date();
              if (status === 'READ') updateData.readAt = new Date();
              if (status === 'FAILED') {
                updateData.errorReason = statusObj.errors?.[0]?.title || 'Erro no envio';
              }

              await this.prisma.campaignRecipient.update({
                where: { id: recipient.id },
                data: updateData,
              });

              // Incrementa contadores atômicos na campanha
              if (status === 'DELIVERED') {
                await this.prisma.campaign.update({
                  where: { id: recipient.campaignId },
                  data: { deliveredCount: { increment: 1 } },
                });
              } else if (status === 'READ') {
                await this.prisma.campaign.update({
                  where: { id: recipient.campaignId },
                  data: { readCount: { increment: 1 } },
                });
              } else if (status === 'FAILED') {
                await this.prisma.campaign.update({
                  where: { id: recipient.campaignId },
                  data: { failedCount: { increment: 1 } },
                });
              }
            }
          }
        }
      }

      // 2. Tratamento de Mensagens Recebidas (Inbound / Detecção de Opt-Out)
      if (changes?.messages && Array.isArray(changes.messages)) {
        for (const msg of changes.messages) {
          const from = '+' + msg.from;
          const text = msg.text?.body?.trim().toUpperCase();

          // Palavras-chave de descadastramento (LGPD e Regras da Meta)
          if (text && ['SAIR', 'PARAR', 'CANCELAR', 'STOP', 'UNSUBSCRIBE'].includes(text)) {
            this.logger.warn(`Opt-out recebido do telefone ${from}`);

            // Atualiza o contato para OPT_OUT em todos os tenants onde ele existir
            await this.prisma.contact.updateMany({
              where: { phone: from },
              data: {
                consentStatus: 'OPT_OUT',
                suppressionReason: 'Solicitado via mensagem de WhatsApp (Palavra-chave: ' + text + ')',
              },
            });
          }
        }
      }
    } catch (e: any) {
      this.logger.error(`Erro ao processar webhook: ${e.message}`);
    }

    return { received: true };
  }
}
