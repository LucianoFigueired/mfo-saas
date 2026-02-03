import { Module } from '@nestjs/common';
import { ProjectionsService } from './projections.service';
import { ProjectionsController } from './projections.controller';

@Module({
  providers: [ProjectionsService],
  controllers: [ProjectionsController]
})
export class ProjectionsModule {}
