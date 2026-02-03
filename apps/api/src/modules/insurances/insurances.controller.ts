// apps/api/src/modules/insurances/insurances.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  UsePipes,
} from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateInsuranceSchema, UpdateInsuranceSchema } from '@mfo/common';
import type { CreateInsuranceDto, UpdateInsuranceDto } from '@mfo/common';

@Controller('simulations/:simulationId/insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateInsuranceSchema))
  create(
    @Param('simulationId') simulationId: string,
    @Body() dto: CreateInsuranceDto,
  ) {
    return this.insurancesService.create(simulationId, dto);
  }

  @Get()
  findAll(@Param('simulationId') simulationId: string) {
    return this.insurancesService.findAllBySimulation(simulationId);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateInsuranceSchema))
  update(@Param('id') id: string, @Body() dto: UpdateInsuranceDto) {
    return this.insurancesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.insurancesService.remove(id);
  }
}
