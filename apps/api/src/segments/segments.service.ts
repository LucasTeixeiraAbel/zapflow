import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SegmentsService {
  constructor(private prisma: PrismaService) {}

  async getSegmentedContacts(tenantId: string, filter: 'inactive30' | 'inactive45' | 'birthday') {
    const where: any = { tenantId, consentStatus: 'GRANTED' };

    if (filter === 'inactive30') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      where.lastVisitAt = { lt: date };
    }
    // Implementar lógica de outros filtros conforme necessário

    return this.prisma.contact.findMany({ where });
  }
}
