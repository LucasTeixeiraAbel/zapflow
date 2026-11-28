import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getCampaignAnalytics(tenantId: string, campaignId: string) {
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId, campaign: { tenantId } },
    });

    const total = recipients.length;
    const sent = recipients.filter(r => r.status === 'SENT').length;
    const failed = recipients.filter(r => r.status === 'FAILED').length;
    const delivered = recipients.filter(r => r.status === 'DELIVERED').length;
    const read = recipients.filter(r => r.status === 'READ').length;

    return { total, sent, failed, delivered, read };
  }
}
