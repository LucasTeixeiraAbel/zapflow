import { Module, Global } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [AuthModule, TenantsModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
