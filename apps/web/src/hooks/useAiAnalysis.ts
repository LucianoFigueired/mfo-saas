import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { AiAnalysisData, AnalysisSocketEvent } from "@/types/ai-analysis";

const ANALYSIS_QUERY_KEY = ["ai-analysis"];
const ANALYSIS_STALE_KEY = ["ai-analysis-stale"];

export const useAiAnalysis = (simulationId: string) => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const { data: analysis, isLoading } = useQuery({
    queryKey: [ANALYSIS_QUERY_KEY, simulationId],
    queryFn: async () => {
      const response = await api.get<AiAnalysisData>(`/api/simulations/${simulationId}/analysis/latest`);
      return response.data;
    },
    enabled: !!simulationId,
    staleTime: Infinity,
  });

  const { mutate: triggerAnalysis, isPending: isAnalyzing } = useMutation({
    mutationFn: async () => {
      return await api.post(`/api/simulations/${simulationId}/analysis/generate`);
    },
    onError: () => {
      toast.error("Erro ao iniciar análise inteligente.");
    },
  });

  useEffect(() => {
    if (!simulationId || !token) return;
    const socket = getSocket(token);
    if (!socket.connected) socket.connect();

    socket.on("ai_analysis_completed", (payload: AnalysisSocketEvent) => {
      if (payload.simulationId === simulationId) {
        queryClient.setQueryData([ANALYSIS_QUERY_KEY, simulationId], payload.analysis);

        queryClient.setQueryData([ANALYSIS_STALE_KEY, simulationId], false);

        toast.info("Nova análise da IA disponível!");
      }
    });

    return () => {
      socket.off("ai_analysis_completed");
    };
  }, [simulationId, token, queryClient]);

  useEffect(() => {
    const isStale = queryClient.getQueryData<boolean>([ANALYSIS_STALE_KEY, simulationId]);

    if (isStale && !isAnalyzing && simulationId) {
      console.log("Detectadas alterações nos dados. Iniciando análise sob demanda...");
      triggerAnalysis();
    }
  }, [simulationId, queryClient, isAnalyzing, triggerAnalysis]);

  const markAnalysisAsStale = () => {
    queryClient.setQueryData([ANALYSIS_STALE_KEY, simulationId], true);
  };

  return {
    analysis,
    isLoading,
    isAnalyzing,
    markAnalysisAsStale,
  };
};
