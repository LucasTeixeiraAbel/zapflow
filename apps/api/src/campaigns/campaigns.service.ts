import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { SendMessageJobData } from './campaigns.processor';

export interface CreateCampaignDto {
  name: string;
  templateName: string;
  contactIds?: string[];
  filterTags?: string[];
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('messages') private readonly messagesQueue: Queue,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { recipients: true },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, tenantId },
      include: {
        recipients: {
          take: 100,
          orderBy: { createdAt: 'asc' },
          include: {
            contact: {
              select: { name: true, phone: true, consentStatus: true },
            },
          },
        },
      },
    });

    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async create(tenantId: string, dto: CreateCampaignDto) {
    if (!dto.name || !dto.templateName) {
      throw new BadRequestException('Nome da campanha e template são obrigatórios');
    }

    // 1. Busca os contatos elegíveis (excluindo contatos com OPT_OUT)
    const contactsWhere: any = {
      tenantId,
      consentStatus: { not: 'OPT_OUT' }, // Garantia de conformidade LGPD
    };

    if (dto.contactIds && dto.contactIds.length > 0) {
      contactsWhere.id = { in: dto.contactIds };
    } else if (dto.filterTags && dto.filterTags.length > 0) {
      contactsWhere.tags = { hasSome: dto.filterTags };
    }

    const eligibleContacts = await this.prisma.contact.findMany({
      where: contactsWhere,
    });

    if (eligibleContacts.length === 0) {
      throw new BadRequestException(
        'Nenhum contato elegível encontrado para esta campanha (verifique consentimento e filtros).',
      );
    }

    // 2. Cria a campanha com status PROCESSING
    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        templateName: dto.templateName,
        status: 'PROCESSING',
        totalCount: eligibleContacts.length,
      },
    });

    // 3. Cria os CampaignRecipients em lote
    await this.prisma.campaignRecipient.createMany({
      data: eligibleContacts.map((c) => ({
        campaignId: campaign.id,
        contactId: c.id,
        phone: c.phone,
        contactName: c.name,
        status: 'QUEUED',
      })),
    });

    // 4. Busca os recipients criados com seus IDs para enfileirar no BullMQ
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId: campaign.id },
      select: { id: true, contactId: true, phone: true, contactName: true },
    });

    // 5. Enfileiramento em lote atômico (addBulk) evitando timeouts
    const jobs = recipients.map((r) => ({
      name: 'send-message',
      data: {
        campaignId: campaign.id,
        recipientId: r.id,
        contactId: r.contactId,
        tenantId,
        phone: r.phone,
        contactName: r.contactName,
        templateName: dto.templateName,
      } as SendMessageJobData,
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      },
    }));

    await this.messagesQueue.addBulk(jobs);

    return {
      ...campaign,
      recipientsQueued: jobs.length,
    };
  }

  async getStats(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      select: {
        totalCount: true,
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
      },
    });

    const totals = campaigns.reduce(
      (acc, c) => {
        acc.total += c.totalCount;
        acc.sent += c.sentCount;
        acc.delivered += c.deliveredCount;
        acc.read += c.readCount;
        acc.failed += c.failedCount;
        return acc;
      },
      { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
    );

    const deliveryRate = totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 100) : 0;
    const readRate = totals.delivered > 0 ? Math.round((totals.read / totals.delivered) * 100) : 0;

    return {
      ...totals,
      deliveryRate,
      readRate,
    };
  }
}
