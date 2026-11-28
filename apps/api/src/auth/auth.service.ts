import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Cria Tenant, Usuário, Membership e Conexão WhatsApp simulada inicial em transação
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName.trim(),
          slug: dto.companyName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          name: dto.name.trim(),
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });

      // Criação da conexão WhatsApp padrão no modo simulado para teste imediato
      await tx.whatsAppConnection.create({
        data: {
          tenantId: tenant.id,
          provider: 'SIMULATED',
          status: 'CONNECTED',
          displayName: `${tenant.name} WhatsApp`,
          displayPhoneNumber: '+55 11 99999-0000',
          qualityRating: 'GREEN',
        },
      });

      return { user, tenant, membership };
    });

    const token = this.generateToken(result.user.id, result.user.email, result.tenant.id, result.membership.role);

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        role: result.membership.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.memberships || user.memberships.length === 0) {
      throw new UnauthorizedException('Usuário não pertence a nenhuma empresa');
    }

    // Seleciona a primeira empresa por padrão
    const activeMembership = user.memberships[0];

    const token = this.generateToken(
      user.id,
      user.email,
      activeMembership.tenantId,
      activeMembership.role,
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tenant: {
        id: activeMembership.tenant.id,
        name: activeMembership.tenant.name,
        role: activeMembership.role,
      },
    };
  }

  async getProfile(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        whatsappConnections: {
          select: {
            id: true,
            provider: true,
            status: true,
            displayName: true,
            displayPhoneNumber: true,
            qualityRating: true,
          },
        },
      },
    });

    return {
      user,
      tenant,
    };
  }

  private generateToken(userId: string, email: string, tenantId: string, role: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      tenantId,
      role,
    });
  }
}
