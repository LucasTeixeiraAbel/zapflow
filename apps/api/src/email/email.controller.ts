import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('connection')
  async getConnection(@CurrentTenant() tenantId: string) {
    return this.emailService.getConnection(tenantId);
  }

  @Put('connection')
  async updateConnection(
    @CurrentTenant() tenantId: string,
    @Body()
    dto: {
      provider: 'SIMULATED' | 'BREVO';
      senderEmail?: string;
      senderName?: string;
      apiKey?: string;
    },
  ) {
    return this.emailService.updateConnection(tenantId, dto);
  }

  @Post('test')
  async sendTestEmail(
    @CurrentTenant() tenantId: string,
    @Body() dto: { toEmail: string; subject?: string },
  ) {
    return this.emailService.sendEmail(tenantId, {
      toEmail: dto.toEmail,
      recipientName: 'Usuário Teste',
      subject: dto.subject || 'Teste de Conexão ZapFlow & Brevo',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">⚡ ZapFlow & Brevo</h2>
          <p>Seu canal de e-mail promocional foi configurado com sucesso!</p>
          <p>Você já pode disparar comunicações multicanal diretamente pela plataforma.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <small style="color: #888;">Mensagem de validação enviada via ZapFlow SaaS.</small>
        </div>
      `,
    });
  }
}
