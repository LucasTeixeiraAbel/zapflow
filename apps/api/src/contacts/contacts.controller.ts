import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService, CreateContactDto } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.contactsService.findAll(tenantId, search);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(tenantId, dto);
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateContactDto>,
  ) {
    return this.contactsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contactsService.delete(tenantId, id);
  }

  @Put(':id/consent')
  async toggleConsent(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('consentStatus') consentStatus: 'OPT_IN' | 'OPT_OUT',
  ) {
    return this.contactsService.toggleConsent(tenantId, id, consentStatus);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    return this.contactsService.importCsv(tenantId, file.buffer);
  }
}
