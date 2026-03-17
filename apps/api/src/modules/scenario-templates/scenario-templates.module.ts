import { Module } from '@nestjs/common';

import { ScenarioTemplatesController } from './scenario-templates.controller';
import { ScenarioTemplatesService } from './scenario-templates.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScenarioTemplatesController],
  providers: [ScenarioTemplatesService],
})
export class ScenarioTemplatesModule {}
