// apps/api/src/modules/simulations/simulations.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateSimulationSchema, UpdateSimulationSchema } from '@mfo/common';

import type { CreateSimulationDto, UpdateSimulationDto } from '@mfo/common';

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateSimulationSchema))
  create(@Body() createSimulationDto: CreateSimulationDto) {
    // Por enquanto, usaremos um userId fixo até termos Auth
    const userId = 'ID-DO-USER-DO-SEED';
    return this.simulationsService.create(createSimulationDto, userId);
  }

  @Get()
  findAll() {
    return this.simulationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simulationsService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateSimulationSchema))
  update(
    @Param('id') id: string,
    @Body() updateSimulationDto: UpdateSimulationDto,
  ) {
    return this.simulationsService.update(id, updateSimulationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulationsService.remove(id);
  }
}
