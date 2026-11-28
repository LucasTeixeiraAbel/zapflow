import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService, CreateCampaignDto } from './campaigns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.campaignsService.findAll(tenantId);
  }

  @Get('stats')
  async getStats(@CurrentTenant() tenantId: string) {
    return this.campaignsService.getStats(tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.campaignsService.findOne(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(tenantId, dto);
  }
}
