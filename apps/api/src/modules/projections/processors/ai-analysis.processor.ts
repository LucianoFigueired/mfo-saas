import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Processor('ai-analysis')
@Injectable()
export class AiAnalysisProcessor extends WorkerHost {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { simulationId, results, metadata } = job.data;

    if (job.name === 'analyze-sensitivity') {
      const analysis = await this.aiService.analyzeSensitivity({
        metadata,
        projections: results.filter((_, index) => index % 5 === 0),
      });

      await this.prisma.aiAnalysis.create({
        data: {
          simulationId: simulationId,
          summary: analysis.summary,
          risks: analysis.risks,
          suggestions: analysis.suggestions,
          rawResponse: analysis,
        },
      });

      console.log(
        `[Worker] Análise de IA persistida com sucesso para: ${simulationId}`,
      );

      return analysis;
    }
  }
}
