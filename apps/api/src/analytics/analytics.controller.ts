import { Controller, Get, Param, Headers } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('campaign/:id')
  async getCampaignAnalytics(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.analyticsService.getCampaignAnalytics(tenantId, id);
  }
}
