import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { SendMessageJobData } from './campaigns.processor';

export interface CreateCampaignDto {
  name: string;
  templateName?: string;
  channel?: 'WHATSAPP' | 'EMAIL';
  emailSubject?: string;
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
              select: { name: true, phone: true, email: true, consentStatus: true },
            },
          },
        },
      },
    });

    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async create(tenantId: string, dto: CreateCampaignDto) {
    const channel = dto.channel || 'WHATSAPP';
    const templateName = dto.templateName || (channel === 'EMAIL' ? 'email_promocional' : 'ola_boas_vindas');

    if (!dto.name) {
      throw new BadRequestException('Nome da campanha é obrigatório');
    }

    if (channel === 'EMAIL' && !dto.emailSubject) {
      throw new BadRequestException('Assunto do e-mail é obrigatório para campanhas de e-mail');
    }

    // 1. Busca os contatos elegíveis (excluindo contatos com OPT_OUT)
    const contactsWhere: any = {
      tenantId,
      consentStatus: { not: 'OPT_OUT' }, // Garantia de conformidade LGPD
    };

    if (channel === 'EMAIL') {
      contactsWhere.email = { not: null };
    }

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
        channel === 'EMAIL'
          ? 'Nenhum contato com e-mail válido e consentimento ativo foi encontrado.'
          : 'Nenhum contato elegível encontrado para esta campanha (verifique consentimento e filtros).',
      );
    }

    // 2. Cria a campanha com status PROCESSING
    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        channel,
        emailSubject: dto.emailSubject || null,
        templateName,
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
        email: c.email || null,
        contactName: c.name,
        status: 'QUEUED',
      })),
    });

    // 4. Busca os recipients criados com seus IDs para enfileirar no BullMQ
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId: campaign.id },
      select: { id: true, contactId: true, phone: true, email: true, contactName: true },
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
        email: r.email || undefined,
        contactName: r.contactName,
        templateName,
        channel,
        emailSubject: dto.emailSubject,
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

    const totalCampaigns = campaigns.length;
    const totalMessages = campaigns.reduce((acc, c) => acc + c.totalCount, 0);
    const sent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const delivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
    const read = campaigns.reduce((acc, c) => acc + c.readCount, 0);
    const failed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);

    const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
    const readRate = delivered > 0 ? Number(((read / delivered) * 100).toFixed(1)) : 0;

    return {
      totalCampaigns,
      totalMessages,
      sent,
      delivered,
      read,
      failed,
      deliveryRate,
      readRate,
    };
  }
}
