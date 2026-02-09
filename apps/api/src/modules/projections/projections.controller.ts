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
  async getProjection(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(ProjectionQuerySchema))
    query: ProjectionQueryDto,
    @Req() req: any,
  ) {
    return this.projectionsService.generate(id, req.user.userId, query.status);
  }
  @Post(':id/version')
  async createNewVersion(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateVersionSchema)) body: CreateVersionDto,
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
