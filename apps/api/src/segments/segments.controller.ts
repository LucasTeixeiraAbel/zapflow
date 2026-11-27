import { Controller, Get, Headers, Query } from '@nestjs/common';
import { SegmentsService } from './segments.service';

@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get('contacts')
  async getContacts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type: 'inactive30' | 'inactive45' | 'birthday'
  ) {
    return this.segmentsService.getSegmentedContacts(tenantId, type);
  }
}
