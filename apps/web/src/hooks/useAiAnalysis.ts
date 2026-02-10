import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { AiAnalysisData, AnalysisSocketEvent } from "@/types/ai-analysis";

const ANALYSIS_QUERY_KEY = ["ai-analysis"];

export const useAiAnalysis = (simulationId: string) => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analysis, isLoading } = useQuery({
    queryKey: [ANALYSIS_QUERY_KEY, simulationId],
    queryFn: async () => {
      const response = await api.get<AiAnalysisData>(`/api/simulations/${simulationId}/analysis/latest`);
      return response.data;
    },
    enabled: !!simulationId,
  });

  useEffect(() => {
    if (!simulationId || !token) return;

    const socket = getSocket(token);

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("ai_analysis_completed", (payload: AnalysisSocketEvent) => {
      if (payload.simulationId === simulationId) {
        queryClient.setQueryData([ANALYSIS_QUERY_KEY, simulationId], payload.analysis);

        setIsAnalyzing(false);
        toast.info("Nova análise da IA disponível!", {
          description: "Os dados foram reprocessados com base nas suas alterações.",
        });
      }
    });

    return () => {
      socket.off("ai_analysis_completed");
    };
  }, [simulationId, token, queryClient]);

  const notifyAnalysisStarted = () => {
    setIsAnalyzing(true);
  };

  return {
    analysis,
    isLoading,
    isAnalyzing,
    notifyAnalysisStarted,
  };
};
