export interface AiAnalysisData {
  id: string;
  simulationId: string;
  summary: string;
  risks: string[];
  suggestions: string[];
  createdAt: string;
}

export interface AnalysisSocketEvent {
  simulationId: string;
  analysis: AiAnalysisData;
}
