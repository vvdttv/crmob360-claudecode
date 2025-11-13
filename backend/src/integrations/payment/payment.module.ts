import { Module } from '@nestjs/common';
import { JunoService } from './juno.service';

@Module({
  providers: [JunoService],
  exports: [JunoService],
})
export class PaymentModule {}
