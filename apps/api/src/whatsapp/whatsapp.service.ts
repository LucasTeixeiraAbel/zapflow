import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface SendMessagePayload {
  recipientPhone: string;
  contactName: string;
  templateName: string;
  variables?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY';
  language: string;
  body: string;
  exampleVariables: string[];
}

export const SYSTEM_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'ola_boas_vindas',
    name: 'Boas-Vindas ZapFlow',
    category: 'MARKETING',
    language: 'pt_BR',
    body: 'Olá {{1}}! Seja muito bem-vindo(a) à nossa comunidade. Qualquer dúvida, responda a esta mensagem. Para cancelar o recebimento, envie SAIR.',
    exampleVariables: ['Nome do Cliente'],
  },
  {
    id: 'promocao_exclusiva',
    name: 'Oferta Especial Exclusiva',
    category: 'MARKETING',
    language: 'pt_BR',
    body: 'Olá {{1}}! Preparamos uma condição exclusiva para você hoje: {{2}}. Aproveite enquanto durar o estoque! Responda SAIR para descadastrar.',
    exampleVariables: ['Nome do Cliente', '20% OFF no pix'],
  },
  {
    id: 'lembrete_agendamento',
    name: 'Lembrete de Horário',
    category: 'UTILITY',
    language: 'pt_BR',
    body: 'Olá {{1}}, este é um lembrete do seu agendamento marcado para {{2}}. Por favor, responda SIM para confirmar.',
    exampleVariables: ['Nome do Cliente', 'Amanhã às 14:00'],
  },
  {
    id: 'pesquisa_satisfacao',
    name: 'Pesquisa de Satisfação',
    category: 'UTILITY',
    language: 'pt_BR',
    body: 'Olá {{1}}! Como foi sua experiência recente conosco? Avalie de 1 a 5 respondendo esta mensagem.',
    exampleVariables: ['Nome do Cliente'],
  },
];

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly prisma: PrismaService) {}

  getAvailableTemplates(): TemplateDefinition[] {
    return SYSTEM_TEMPLATES;
  }

  async getConnection(tenantId: string) {
    let connection = await this.prisma.whatsAppConnection.findFirst({
      where: { tenantId },
    });

    if (!connection) {
      connection = await this.prisma.whatsAppConnection.create({
        data: {
          tenantId,
          provider: 'SIMULATED',
          status: 'CONNECTED',
          displayName: 'WhatsApp Oficial ZapFlow (Simulado)',
          displayPhoneNumber: '+55 11 98888-7777',
          qualityRating: 'GREEN',
        },
      });
    }

    return connection;
  }

  async updateConnection(
    tenantId: string,
    dto: {
      provider: 'SIMULATED' | 'CLOUD_API' | 'EVOLUTION_API';
      phoneNumberId?: string;
      wabaId?: string;
      displayPhoneNumber?: string;
      displayName?: string;
      accessToken?: string;
    },
  ) {
    const current = await this.getConnection(tenantId);

    return this.prisma.whatsAppConnection.update({
      where: { id: current.id },
      data: {
        provider: dto.provider,
        phoneNumberId: dto.phoneNumberId !== undefined ? dto.phoneNumberId : current.phoneNumberId,
        wabaId: dto.wabaId !== undefined ? dto.wabaId : current.wabaId,
        displayPhoneNumber: dto.displayPhoneNumber || current.displayPhoneNumber,
        displayName: dto.displayName || current.displayName,
        accessTokenEncrypted: dto.accessToken !== undefined ? dto.accessToken : current.accessTokenEncrypted,
        status: 'CONNECTED',
      },
    });
  }

  async getEvolutionQrCode(
    tenantId: string,
    data: { apiUrl: string; instanceName: string; apiKey: string },
  ) {
    const baseUrl = data.apiUrl.replace(/\/$/, '');
    const instance = data.instanceName.trim();
    const apiKey = data.apiKey.trim();

    try {
      // 1. Tenta conectar na instância se já existir
      let res = await fetch(`${baseUrl}/instance/connect/${instance}`, {
        method: 'GET',
        headers: { apikey: apiKey },
      });

      let json: any = null;
      if (res.ok) {
        json = await res.json();
      } else {
        // 2. Se a instância ainda não existe, cria a instância e pede QR code
        res = await fetch(`${baseUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
          },
          body: JSON.stringify({
            instanceName: instance,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });
        json = await res.json();
      }

      const qrcodeData = json?.qrcode?.base64 || json?.base64 || json?.code;
      if (qrcodeData) {
        const fullBase64 = qrcodeData.startsWith('data:')
          ? qrcodeData
          : `data:image/png;base64,${qrcodeData}`;
        return { success: true, qrcode: fullBase64 };
      }

      // Se já estiver conectado
      if (json?.instance?.state === 'open' || json?.state === 'open') {
        return { success: true, alreadyConnected: true };
      }

      return {
        success: false,
        error: json?.message || 'Não foi possível gerar o QR Code. Verifique os dados da Evolution API.',
      };
    } catch (err: any) {
      this.logger.error(`Erro ao gerar QR Code na Evolution API: ${err.message}`);
      throw new BadRequestException('Falha de conexão com a Evolution API: ' + err.message);
    }
  }

  async sendMessage(tenantId: string, payload: SendMessagePayload): Promise<SendResult> {
    const connection = await this.getConnection(tenantId);

    if (connection.provider === 'SIMULATED') {
      return this.sendSimulated(payload);
    } else if (connection.provider === 'EVOLUTION_API') {
      return this.sendEvolutionApi(connection, payload);
    } else {
      return this.sendCloudApi(connection, payload);
    }
  }

  private async sendSimulated(payload: SendMessagePayload): Promise<SendResult> {
    await new Promise((r) => setTimeout(r, 50));

    const wamid = 'wamid.' + Buffer.from(
      `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${payload.recipientPhone}`,
    ).toString('base64');

    this.logger.log(
      `[SIMULATED] Mensagem simulada para ${payload.recipientPhone} (${payload.contactName}). WAMID: ${wamid}`,
    );

    return {
      success: true,
      messageId: wamid,
    };
  }

  private async sendEvolutionApi(
    connection: any,
    payload: SendMessagePayload,
  ): Promise<SendResult> {
    const baseUrl = connection.phoneNumberId?.replace(/\/$/, '') || 'http://localhost:8080';
    const instance = connection.wabaId || 'default';
    const apiKey = connection.accessTokenEncrypted || '';

    const template = SYSTEM_TEMPLATES.find((t) => t.id === payload.templateName);
    let messageText = template
      ? template.body.replace('{{1}}', payload.contactName).replace('{{2}}', 'condição especial')
      : `Olá ${payload.contactName}!`;

    try {
      this.logger.log(`[Evolution API] Enviando mensagem via ${baseUrl}/message/sendText/${instance} para ${payload.recipientPhone}`);

      const cleanedNumber = payload.recipientPhone.replace(/[^\d]/g, '');
      const url = `${baseUrl}/message/sendText/${instance}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          number: cleanedNumber,
          text: messageText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`[Evolution API] Erro: ${JSON.stringify(data)}`);
        return {
          success: false,
          messageId: '',
          error: data.message || data.error || 'Falha ao enviar via Evolution API',
        };
      }

      const messageId = data?.key?.id || 'evo_' + Date.now();
      return {
        success: true,
        messageId,
      };
    } catch (err: any) {
      this.logger.error(`Exceção ao chamar Evolution API: ${err.message}`);
      return {
        success: false,
        messageId: '',
        error: err.message,
      };
    }
  }

  private async sendCloudApi(
    connection: any,
    payload: SendMessagePayload,
  ): Promise<SendResult> {
    if (!connection.phoneNumberId || !connection.accessTokenEncrypted) {
      throw new BadRequestException('Configurações de WhatsApp Cloud API incompletas');
    }

    const template = SYSTEM_TEMPLATES.find((t) => t.id === payload.templateName);
    const templateNameOnMeta = template ? template.id : payload.templateName;

    try {
      const url = `https://graph.facebook.com/v21.0/${connection.phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.accessTokenEncrypted}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: payload.recipientPhone.replace('+', ''),
          type: 'template',
          template: {
            name: templateNameOnMeta,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: payload.contactName },
                  ...(payload.variables ? Object.values(payload.variables).map(v => ({ type: 'text', text: v })) : [])
                ],
              },
            ],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        this.logger.error(`Erro ao disparar via Meta Cloud API: ${JSON.stringify(data)}`);
        return {
          success: false,
          messageId: '',
          error: data.error?.message || 'Falha no envio pela Meta API',
        };
      }

      const messageId = data.messages?.[0]?.id || 'wamid.meta_' + Date.now();
      return {
        success: true,
        messageId,
      };
    } catch (err: any) {
      this.logger.error(`Exceção ao chamar Meta Cloud API: ${err.message}`);
      return {
        success: false,
        messageId: '',
        error: err.message,
      };
    }
  }
}
