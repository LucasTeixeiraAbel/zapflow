import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Populando banco de dados com dados fictícios ---');

  // Criar Tenant
  const tenant = await prisma.tenant.create({
    data: { name: 'Barbearia do Lucas' }
  });
  console.log('Tenant criado:', tenant.id);

  // Criar Contatos
  await prisma.contact.createMany({
    data: [
      { tenantId: tenant.id, name: 'João Silva', phone: '+5511999999999', consentStatus: 'GRANTED' },
      { tenantId: tenant.id, name: 'Maria Souza', phone: '+5511888888888', consentStatus: 'GRANTED' }
    ]
  });
  console.log('Contatos criados.');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
