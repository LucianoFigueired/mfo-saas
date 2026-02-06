import { Module } from '@nestjs/common';
import { ProjectionsService } from './projections.service';
import { ProjectionsController } from './projections.controller';
import { BullModule } from '@nestjs/bullmq';
import { SensitivityListener } from './listeners/sensitivity.listener';
import { AiAnalysisProcessor } from './processors/ai-analysis.processor';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    AiModule,
    BullModule.registerQueue({ name: 'ai-analysis' }),
  ],
  providers: [ProjectionsService, SensitivityListener, AiAnalysisProcessor],
  controllers: [ProjectionsController],
})
export class ProjectionsModule {}
