// apps/api/src/modules/projections/projections.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectionsService } from './projections.service';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  ProjectionQuerySchema,
  CreateVersionSchema,
  type CreateVersionDto,
  type ProjectionQueryDto,
} from '@mfo/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projections')
export class ProjectionsController {
  constructor(private readonly projectionsService: ProjectionsService) {}

  @Get(':id')
  @UsePipes(new ZodValidationPipe(ProjectionQuerySchema))
  async getProjection(
    @Param('id') id: string,
    @Query() query: ProjectionQueryDto,
    @Req() req: any,
  ) {
    // Passamos o userId para garantir que ele só projete o que lhe pertence
    return this.projectionsService.generate(id, req.user.userId, query.status);
  }

  @Post(':id/version')
  @UsePipes(new ZodValidationPipe(CreateVersionSchema))
  async createNewVersion(
    @Param('id') id: string,
    @Body() body: CreateVersionDto,
    @Req() req: any,
  ) {
    return this.projectionsService.createVersion(
      id,
      req.user.userId,
      body.name,
    );
  }

  @Post(':id/actual')
  async createActualSituation(@Param('id') id: string, @Req() req: any) {
    return this.projectionsService.createVersion(
      id,
      req.user.userId,
      'Situação Atual',
      true,
    );
  }
}
