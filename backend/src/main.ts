import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('CORS_ORIGIN').split(','),
    credentials: true,
  });

  // Compression
  app.use(compression());

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: configService.get('RATE_LIMIT_TTL') * 1000,
      max: configService.get('RATE_LIMIT_MAX'),
      message: 'Muitas requisições deste IP, tente novamente em breve.',
    }),
  );

  // Global Prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Plataforma de Gestão Imobiliária 360 API')
    .setDescription(
      'API REST completa para gerenciamento de operações imobiliárias: CRM, Marketing, IA, Financeiro, LGPD e muito mais.',
    )
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticação e Autorização')
    .addTag('CRM', 'Módulo 1 - Vendas e Atendimento ao Cliente')
    .addTag('Marketing', 'Módulo 2 - Marketing e Relacionamento')
    .addTag('Site Builder', 'Módulo 3 - Construtor de Sites')
    .addTag('AI', 'Módulo 4 - Inteligência Artificial')
    .addTag('Properties', 'Módulo 5 - Gestão de Imóveis')
    .addTag('Processes', 'Módulo 6 - Gestão de Processos')
    .addTag('Owner', 'Módulo 7 - Gestão do Proprietário')
    .addTag('Admin', 'Módulo 8 - Administração e Comissões')
    .addTag('Financial', 'Módulo 9 - Financeiro e Contábil')
    .addTag('Mobile', 'Módulo 10 - Aplicativo Móvel')
    .addTag('BI', 'Módulo 11 - Dashboards e Relatórios')
    .addTag('Platform', 'Módulo 12 - Configurações e Plataforma')
    .addTag('LGPD', 'Módulo 13 - Conformidade e Governança')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════════╗
    ║  🏢 Plataforma de Gestão Imobiliária 360                     ║
    ║  📍 Servidor rodando em: ${configService.get('APP_URL') || `http://localhost:${port}`}
    ║  📚 Documentação Swagger: ${configService.get('APP_URL') || `http://localhost:${port}`}/api/docs
    ║  🚀 Ambiente: ${configService.get('NODE_ENV')}
    ╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
