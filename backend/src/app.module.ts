import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Módulos de Negócio
import { CrmModule } from './modules/crm/crm.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { SiteBuilderModule } from './modules/site-builder/site-builder.module';
import { AiModule } from './modules/ai/ai.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ProcessesModule } from './modules/processes/processes.module';
import { OwnerModule } from './modules/owner/owner.module';
import { AdminModule } from './modules/admin/admin.module';
import { FinancialModule } from './modules/financial/financial.module';
import { MobileModule } from './modules/mobile/mobile.module';
import { BiModule } from './modules/bi/bi.module';
import { PlatformModule } from './modules/platform/platform.module';
import { LgpdModule } from './modules/lgpd/lgpd.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
        synchronize: configService.get('DB_SYNC') === 'true',
        logging: configService.get('DB_LOGGING') === 'true',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req, res }) => ({ req, res }),
    }),

    // Schedule (para tarefas automatizadas)
    ScheduleModule.forRoot(),

    // Event Emitter (para comunicação entre módulos)
    EventEmitterModule.forRoot(),

    // Módulos de Negócio (13 Módulos)
    LgpdModule,        // Módulo 13 - LGPD (base para todos)
    PlatformModule,    // Módulo 12 - Configurações
    CrmModule,         // Módulo 1 - CRM
    MarketingModule,   // Módulo 2 - Marketing
    SiteBuilderModule, // Módulo 3 - Site Builder
    AiModule,          // Módulo 4 - IA
    PropertiesModule,  // Módulo 5 - Imóveis
    ProcessesModule,   // Módulo 6 - Processos
    OwnerModule,       // Módulo 7 - Proprietário
    AdminModule,       // Módulo 8 - Administração
    FinancialModule,   // Módulo 9 - Financeiro
    MobileModule,      // Módulo 10 - Mobile
    BiModule,          // Módulo 11 - BI
  ],
})
export class AppModule {}
