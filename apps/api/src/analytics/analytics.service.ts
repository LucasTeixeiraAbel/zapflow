import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(tenantId: string) {
    const [
      totalContacts,
      optInContacts,
      optOutContacts,
      campaigns,
      recentCampaigns,
      connection,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { tenantId } }),
      this.prisma.contact.count({ where: { tenantId, consentStatus: 'OPT_IN' } }),
      this.prisma.contact.count({ where: { tenantId, consentStatus: 'OPT_OUT' } }),
      this.prisma.campaign.findMany({
        where: { tenantId },
        select: {
          totalCount: true,
          sentCount: true,
          deliveredCount: true,
          readCount: true,
          failedCount: true,
        },
      }),
      this.prisma.campaign.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          templateName: true,
          status: true,
          totalCount: true,
          sentCount: true,
          deliveredCount: true,
          readCount: true,
          failedCount: true,
          createdAt: true,
        },
      }),
      this.prisma.whatsAppConnection.findFirst({
        where: { tenantId },
      }),
    ]);

    const totals = campaigns.reduce(
      (acc, c) => {
        acc.totalMessages += c.totalCount;
        acc.sentMessages += c.sentCount;
        acc.deliveredMessages += c.deliveredCount;
        acc.readMessages += c.readCount;
        acc.failedMessages += c.failedCount;
        return acc;
      },
      {
        totalMessages: 0,
        sentMessages: 0,
        deliveredMessages: 0,
        readMessages: 0,
        failedMessages: 0,
      },
    );

    const deliveryRate =
      totals.sentMessages > 0
        ? Math.round((totals.deliveredMessages / totals.sentMessages) * 100)
        : 100;

    const readRate =
      totals.deliveredMessages > 0
        ? Math.round((totals.readMessages / totals.deliveredMessages) * 100)
        : 85;

    return {
      contacts: {
        total: totalContacts,
        optIn: optInContacts,
        optOut: optOutContacts,
        consentRate: totalContacts > 0 ? Math.round((optInContacts / totalContacts) * 100) : 100,
      },
      messages: {
        ...totals,
        deliveryRate,
        readRate,
      },
      campaignsCount: campaigns.length,
      recentCampaigns,
      whatsapp: {
        provider: connection?.provider || 'SIMULATED',
        status: connection?.status || 'CONNECTED',
        qualityRating: connection?.qualityRating || 'GREEN',
        phone: connection?.displayPhoneNumber || '+55 11 98888-7777',
      },
    };
  }

  async getCampaignAnalytics(tenantId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, tenantId },
      include: {
        recipients: {
          select: {
            id: true,
            phone: true,
            contactName: true,
            status: true,
            errorReason: true,
            sentAt: true,
            deliveredAt: true,
            readAt: true,
          },
        },
      },
    });

    if (!campaign) return null;

    const total = campaign.totalCount;
    const sent = campaign.sentCount;
    const delivered = campaign.deliveredCount;
    const read = campaign.readCount;
    const failed = campaign.failedCount;

    return {
      campaign,
      metrics: {
        total,
        sent,
        delivered,
        read,
        failed,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        readRate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
      },
    };
  }
}
