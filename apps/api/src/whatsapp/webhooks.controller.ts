import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private prisma: PrismaService) {}

  @Post('whatsapp')
  async handleWhatsappWebhook(@Body() body: any) {
    // Exemplo simplificado de processamento de webhook da Meta
    // O ideal é validar a assinatura aqui
    console.log('Webhook recebido:', JSON.stringify(body));

    if (body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]) {
      const statusUpdate = body.entry[0].changes[0].value.statuses[0];
      const messageId = statusUpdate.id;
      const status = statusUpdate.status.toUpperCase(); // e.g., "DELIVERED", "READ"

      // Assumindo que mapeamos nossa mensagem pelo WABA ID
      await this.prisma.campaignRecipient.updateMany({
        where: { id: messageId }, // Ajustar para o campo correto
        data: { status: status }
      });
    }
    return { success: true };
  }
}
