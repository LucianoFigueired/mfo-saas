import { Module } from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { InsurancesController } from './insurances.controller';

@Module({
  controllers: [InsurancesController],
  providers: [InsurancesService],
})
export class InsurancesModule {}
