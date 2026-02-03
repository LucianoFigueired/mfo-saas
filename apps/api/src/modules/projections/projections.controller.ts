import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ProjectionsService } from './projections.service';
import { ZodValidationPipe } from 'nestjs-zod';
import type { CreateVersionDto, ProjectionQueryDto } from '@mfo/common';

import { ProjectionQuerySchema, CreateVersionSchema } from '@mfo/common';

@Controller('projections')
export class ProjectionsController {
  constructor(private readonly projectionsService: ProjectionsService) {}

  @Get(':id')
  @UsePipes(new ZodValidationPipe(ProjectionQuerySchema))
  async getProjection(
    @Param('id') id: string,
    @Query() query: ProjectionQueryDto,
  ) {
    return this.projectionsService.generate(id, query.status);
  }

  @Post(':id/version')
  @UsePipes(new ZodValidationPipe(CreateVersionSchema))
  async createNewVersion(
    @Param('id') id: string,
    @Body() body: CreateVersionDto,
  ) {
    return this.projectionsService.createVersion(id, body.name);
  }

  @Post(':id/actual')
  async createActualSituation(@Param('id') id: string) {
    return this.projectionsService.createVersion(id, 'Situação Atual', true);
  }
}
