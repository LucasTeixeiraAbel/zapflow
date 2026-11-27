import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { PrismaService } from './prisma.service';
import { ContactsModule } from './contacts/contacts.module';
import { SegmentsModule } from './segments/segments.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, 
    TenantsModule, ContactsModule, SegmentsModule
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
