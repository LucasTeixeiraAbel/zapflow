import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { parse } from 'csv-parse/sync';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.contact.findMany({
      where: { tenantId },
    });
  }

  async importCsv(tenantId: string, fileBuffer: Buffer) {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
    });

    const results = {
      imported: 0,
      errors: [],
    };

    for (const record of records) {
      try {
        const phone = this.normalizePhone(record.phone || record.telefone);
        
        await this.prisma.contact.upsert({
          where: {
            // No schema atual não temos um campo único além do ID, 
            // mas no PRD diz que duplicidades são por empresa.
            // Para o MVP, vamos usar uma busca simples ou assumir que o ID externo ou telefone define a unicidade.
            id: record.id || undefined, 
          },
          update: {
            name: record.name || record.nome,
            phone: phone,
            tags: record.tags ? record.tags.split(',') : [],
          },
          create: {
            tenantId,
            name: record.name || record.nome,
            phone: phone,
            tags: record.tags ? record.tags.split(',') : [],
            consentStatus: 'GRANTED', // Assumindo consentimento para este CSV de teste
            consentAt: new Date(),
            consentSource: 'CSV_IMPORT',
          },
        });
        results.imported++;
      } catch (error) {
        results.errors.push({ record, error: error.message });
      }
    }

    return results;
  }

  private normalizePhone(phone: string): string {
    if (!phone) throw new Error('Telefone ausente');
    // Tenta normalizar para formato internacional (Brasil como padrão se não houver +)
    const phoneNumber = parsePhoneNumberWithError(phone, 'BR');
    return phoneNumber.format('E.164');
  }
}
