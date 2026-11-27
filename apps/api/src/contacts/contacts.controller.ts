import { Controller, Get, Post, UseInterceptors, UploadedFile, Headers, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService } from './contacts.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID missing');
    return this.contactsService.findAll(tenantId);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Headers('x-tenant-id') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID missing');
    if (!file) throw new BadRequestException('No file uploaded');
    
    return this.contactsService.importCsv(tenantId, file.buffer);
  }
}
