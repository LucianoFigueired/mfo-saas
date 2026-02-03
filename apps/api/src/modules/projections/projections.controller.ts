import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProjectionsService } from './projections.service';

@Controller('projections')
export class ProjectionsController {
  constructor(private readonly projectionsService: ProjectionsService) {}

  @Get(':id')
  async getProjection(
    @Param('id') id: string,
    @Query('status') status?: 'VIVO' | 'MORTO',
  ) {
    return this.projectionsService.generate(id, status);
  }

  @Post(':id/version')
  async createNewVersion(@Param('id') id: string, @Body('name') name?: string) {
    return this.projectionsService.createVersion(id, name);
  }

  @Post(':id/actual')
  async createActualSituation(@Param('id') id: string) {
    return this.projectionsService.createVersion(id, 'Situação Atual', true);
  }
}
