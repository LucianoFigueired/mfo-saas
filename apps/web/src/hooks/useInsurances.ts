import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CreateInsuranceDto } from "@mfo-common";
import { Insurance } from "@/types/insurance";
import { useAiAnalysis } from "./useAiAnalysis";

const INSURANCES_QUERY_KEY = ["insurances"];
const PROJECTION_QUERY_KEY = ["projection"];

export const useInsurances = (simulationId: string) => {
  const queryClient = useQueryClient();
  const { notifyAnalysisStarted } = useAiAnalysis(simulationId);

  const { data: insurances, isLoading } = useQuery({
    queryKey: [INSURANCES_QUERY_KEY, simulationId],
    queryFn: async () => {
      const response = await api.get<Insurance[]>(`/api/simulations/${simulationId}/insurances`);
      return response.data;
    },
    enabled: !!simulationId,
  });

  const createInsurance = useMutation({
    mutationFn: async (data: CreateInsuranceDto) => {
      return await api.post(`/api/simulations/${simulationId}/insurances`, data);
    },
    onSuccess: () => {
      toast.success("Apólice salva com sucesso!");
      notifyAnalysisStarted();
      queryClient.invalidateQueries({ queryKey: [INSURANCES_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
    onError: () => toast.error("Erro ao salvar apólice."),
  });

  const deleteInsurance = useMutation({
    mutationFn: async (insuranceId: string) => {
      return await api.delete(`/api/simulations/${simulationId}/insurances/${insuranceId}`);
    },
    onSuccess: () => {
      toast.success("Apólice removida.");
      notifyAnalysisStarted();
      queryClient.invalidateQueries({ queryKey: [INSURANCES_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
  });

  return {
    insurances,
    isLoading,
    createInsurance,
    deleteInsurance,
  };
};
