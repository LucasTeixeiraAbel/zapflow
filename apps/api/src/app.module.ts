import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ContactsModule } from './contacts/contacts.module';
import { SegmentsModule } from './segments/segments.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PrismaService } from './prisma.service';
import { AnalyticsModule } from './analytics/analytics.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          // Suporte nativo à URL completa do Upstash (rediss://)
          return {
            connection: {
              url: redisUrl,
              tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
            },
          };
        }
        return {
          connection: {
            host: config.get('REDIS_HOST', 'localhost'),
            port: Number(config.get('REDIS_PORT', 6379)),
            password: config.get<string>('REDIS_PASSWORD'),
          },
        };
      },
    }),
    AuthModule,
    TenantsModule,
    ContactsModule,
    SegmentsModule,
    CampaignsModule,
    WhatsappModule,
    AnalyticsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
