import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { parse } from 'csv-parse/sync';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

export interface CreateContactDto {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  consentStatus?: 'OPT_IN' | 'OPT_OUT' | 'PENDING';
}

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    return contact;
  }

  async create(tenantId: string, dto: CreateContactDto) {
    const phone = this.normalizePhone(dto.phone);

    return this.prisma.contact.upsert({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        },
      },
      update: {
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        tags: dto.tags || [],
        consentStatus: dto.consentStatus || 'OPT_IN',
      },
      create: {
        tenantId,
        name: dto.name.trim(),
        phone,
        email: dto.email?.trim() || null,
        tags: dto.tags || [],
        consentStatus: dto.consentStatus || 'OPT_IN',
        consentSource: 'MANUAL',
      },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateContactDto>) {
    await this.findOne(tenantId, id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.phone) updateData.phone = this.normalizePhone(dto.phone);
    if (dto.email !== undefined) updateData.email = dto.email?.trim() || null;
    if (dto.tags) updateData.tags = dto.tags;
    if (dto.consentStatus) updateData.consentStatus = dto.consentStatus;

    return this.prisma.contact.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async toggleConsent(tenantId: string, id: string, consentStatus: 'OPT_IN' | 'OPT_OUT') {
    const contact = await this.findOne(tenantId, id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        consentStatus,
        suppressionReason: consentStatus === 'OPT_OUT' ? 'Solicitado pelo usuário / descadastramento' : null,
      },
    });
  }

  async importCsv(tenantId: string, fileBuffer: Buffer) {
    let records: any[] = [];
    try {
      records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e: any) {
      throw new BadRequestException('Erro ao processar arquivo CSV: ' + e.message);
    }

    const results = {
      total: records.length,
      imported: 0,
      errors: [] as { row: number; reason: string }[],
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const rawPhone = record.phone || record.telefone || record.celular || record.whatsapp;
        const name = record.name || record.nome || 'Contato ' + (i + 1);
        if (!rawPhone) {
          throw new Error('Coluna de telefone não encontrada');
        }

        const phone = this.normalizePhone(rawPhone);
        const tags = record.tags
          ? record.tags.split(';').map((t: string) => t.trim()).filter(Boolean)
          : [];

        await this.prisma.contact.upsert({
          where: {
            tenantId_phone: {
              tenantId,
              phone,
            },
          },
          update: {
            name: name.trim(),
            tags,
          },
          create: {
            tenantId,
            name: name.trim(),
            phone,
            email: record.email ? record.email.trim() : null,
            tags,
            consentStatus: 'OPT_IN',
            consentSource: 'CSV_IMPORT',
          },
        });
        results.imported++;
      } catch (err: any) {
        results.errors.push({
          row: i + 1,
          reason: err.message,
        });
      }
    }

    return results;
  }

  private normalizePhone(phone: string): string {
    if (!phone) throw new BadRequestException('Telefone é obrigatório');
    try {
      const cleaned = phone.replace(/[^\d+]/g, '');
      const phoneNumber = parsePhoneNumberWithError(cleaned, 'BR');
      return phoneNumber.format('E.164');
    } catch {
      // Se falhar a lib, verifica se pelo menos tem 10 dígitos numéricos e adiciona +55
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
        if (digitsOnly.startsWith('55')) {
          return `+${digitsOnly}`;
        }
        return `+55${digitsOnly}`;
      }
      throw new BadRequestException(`Formato de telefone inválido: "${phone}"`);
    }
  }
}
