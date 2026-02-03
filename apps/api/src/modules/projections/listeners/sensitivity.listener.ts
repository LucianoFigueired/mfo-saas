import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProjectionGeneratedEvent } from '../events/projection-generated.event';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SensitivityListener {
  constructor(@InjectQueue('ai-analysis') private aiQueue: Queue) {}

  @OnEvent('projection.generated')
  async handleProjectionGenerated(event: ProjectionGeneratedEvent) {
    await this.aiQueue.add(
      'analyze-sensitivity',
      {
        simulationId: event.simulationId,
        results: event.results,
        metadata: event.metadata,
        userId: event.userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    console.log(
      `[Queue] Job de análise enviado para o Redis: ${event.simulationId}`,
    );
  }
}
