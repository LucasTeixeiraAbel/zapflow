import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardSummary(@CurrentTenant() tenantId: string) {
    return this.analyticsService.getDashboardSummary(tenantId);
  }

  @Get('campaign/:id')
  async getCampaignAnalytics(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.analyticsService.getCampaignAnalytics(tenantId, id);
  }
}
