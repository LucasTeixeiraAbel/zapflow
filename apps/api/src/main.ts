import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Proteção de Cabeçalhos HTTP com Helmet (XSS, Clickjacking, MIME sniffing, HSTS)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Permite flexibilidade de assets em SaaS
    }),
  );

  // CORS robusto para produção permitindo qualquer origem Vercel
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  // Ouvir em '0.0.0.0' é fundamental em containers Docker no Render
  await app.listen(port, '0.0.0.0');
  console.log(`ZapFlow API ouvindo com sucesso na porta ${port}`);
}
bootstrap();
