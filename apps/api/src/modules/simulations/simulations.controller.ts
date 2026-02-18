import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SimulationsService } from './simulations.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateSimulationSchema, UpdateSimulationSchema } from '@mfo/common';
import type { CreateSimulationDto, UpdateSimulationDto } from '@mfo/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('simulations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateSimulationSchema))
    createSimulationDto: CreateSimulationDto,
    @Req() req: any,
  ) {
    return this.simulationsService.create(createSimulationDto, req.user.userId);
  }

  @Get(':id/analysis/latest')
  async getLatestAnalysis(@Param('id') id: string, @Req() req: any) {
    return this.simulationsService.getLatestAnalysis(id, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.simulationsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.simulationsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSimulationSchema))
    updateSimulationDto: UpdateSimulationDto,
    @Req() req: any,
  ) {
    return this.simulationsService.update(
      id,
      updateSimulationDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.simulationsService.remove(id, req.user.userId);
  }
}
