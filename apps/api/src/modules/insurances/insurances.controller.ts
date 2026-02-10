import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateInsuranceSchema, UpdateInsuranceSchema } from '@mfo/common';
import type { CreateInsuranceDto, UpdateInsuranceDto } from '@mfo/common';

@Controller('simulations/:simulationId/insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  @Post()
  create(
    @Param('simulationId') simulationId: string,
    @Body(new ZodValidationPipe(CreateInsuranceSchema)) dto: CreateInsuranceDto,
  ) {
    return this.insurancesService.create(simulationId, dto);
  }

  @Get()
  findAll(@Param('simulationId') simulationId: string) {
    return this.insurancesService.findAllBySimulation(simulationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateInsuranceSchema)) dto: UpdateInsuranceDto,
  ) {
    return this.insurancesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.insurancesService.remove(id);
  }
}
