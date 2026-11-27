import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  async sendTemplateMessage(recipientId: string, contactId: string, templateId: string) {
    // Placeholder para chamada à API da Meta
    console.log(`Sending WhatsApp template ${templateId} to contact ${contactId}`);
    return { success: true, messageId: 'msg_' + Math.random() };
  }
}
