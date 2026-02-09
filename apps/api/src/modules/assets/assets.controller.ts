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
import { AssetsService } from './assets.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateAssetSchema, UpdateAssetSchema } from '@mfo/common';

import type { CreateAssetDto, UpdateAssetDto } from '@mfo/common';

@Controller('simulations/:simulationId/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  create(
    @Param('simulationId') simulationId: string,
    @Body(new ZodValidationPipe(CreateAssetSchema))
    createAssetDto: CreateAssetDto,
  ) {
    return this.assetsService.create(simulationId, createAssetDto);
  }

  @Get()
  findAll(@Param('simulationId') simulationId: string) {
    return this.assetsService.findAllBySimulation(simulationId);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateAssetSchema))
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
