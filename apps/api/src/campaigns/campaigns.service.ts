import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('messages') private messagesQueue: Queue,
  ) {}

  async create(tenantId: string, data: { name: string; templateId: string; contactIds: string[] }) {
    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId,
        name: data.name,
        templateId: data.templateId,
        recipients: {
          create: data.contactIds.map(contactId => ({ contactId }))
        }
      },
      include: { recipients: true }
    });

    for (const recipient of campaign.recipients) {
      await this.messagesQueue.add('send-message', {
        campaignId: campaign.id,
        recipientId: recipient.id,
        contactId: recipient.contactId,
        templateId: campaign.templateId
      });
    }

    return campaign;
  }
}
