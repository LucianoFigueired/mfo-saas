import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeSensitivity(data: any) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um engenheiro financeiro especialista em Family Office. 
            Analise os dados de projeção patrimonial e retorne um JSON com:
            - "summary": Um resumo da saúde financeira.
            - "risks": Lista de riscos detectados.
            - "suggestions": Lista de sugestões acionáveis (aportes, seguros, redução de custos).`,
          },
          {
            role: 'user',
            content: `Dados da Simulação: ${JSON.stringify(data)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content ?? '');
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha na comunicação com a OpenAI',
      );
    }
  }
}
