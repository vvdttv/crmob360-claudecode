import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentLog } from './entities/consent-log.entity';
import { ConsentTemplate } from './entities/consent-template.entity';
import { LgpdPermissionService } from './services/lgpd-permission.service';
import { LgpdController } from './lgpd.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentLog, ConsentTemplate])],
  providers: [LgpdPermissionService],
  controllers: [LgpdController],
  exports: [LgpdPermissionService], // IMPORTANTE: Exporta para outros módulos usarem
})
export class LgpdModule {}
