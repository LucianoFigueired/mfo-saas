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
      },
      {
        attempts: 3, // Se a OpenAI falhar, tenta 3 vezes
        backoff: {
          type: 'exponential',
          delay: 5000, // Espera 5s antes da primeira tentativa
        },
      },
    );

    console.log(
      `[Queue] Job de análise enviado para o Redis: ${event.simulationId}`,
    );
  }

  private buildAiPrompt(event: ProjectionGeneratedEvent, criticalPoint: any) {
    return `
      Contexto: Simulação de patrimônio para Family Office.
      Nome: ${event.metadata.name}
      Taxa Real: ${event.metadata.baseTax * 100}% a.a.
      Status: ${event.metadata.status}
      
      Resultados:
      - Patrimônio Inicial: ${event.results[0].wealth}
      - Patrimônio Final (2060): ${event.results[event.results.length - 1].wealth}
      ${criticalPoint ? `- ALERTA: O patrimônio esgota-se em ${criticalPoint.year}` : ''}

      Tarefa: Sugira 3 ações de sensibilidade (Ex: aumentar inflação, reduzir aportes ou seguro extra).
    `;
  }

  private mockAiAnalysis(prompt: string) {
    setTimeout(() => {
      console.log('--- Sugestão da IA ---');
      console.log(
        'Notamos que se a inflação subir 1%, o patrimônio esgota-se 5 anos antes.',
      );
      console.log('Deseja simular um aporte extra de R$ 200k no ano 2030?');
    }, 2000);
  }
}
