import { Processor, WorkerHost } from '@nestjs/bullmq';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { Injectable } from '@nestjs/common';
import { AiService } from 'src/modules/ai/ai.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Job } from 'bullmq';

@Processor('ai-analysis')
@Injectable()
export class AiAnalysisProcessor extends WorkerHost {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { simulationId, results, metadata, userId } = job.data;

    if (job.name === 'analyze-sensitivity') {
      const analysis = await this.aiService.analyzeSensitivity({
        metadata,
        projections: results.filter((_, index) => index % 5 === 0),
      });

      const savedAnalysis = await this.prisma.aiAnalysis.create({
        data: {
          simulationId,
          summary: analysis.summary,
          risks: analysis.risks,
          suggestions: analysis.suggestions,
        },
      });

      this.notificationsGateway.sendToUser(userId, 'ai_analysis_completed', {
        simulationId,
        analysis: savedAnalysis,
      });

      return savedAnalysis;
    }
  }
}
