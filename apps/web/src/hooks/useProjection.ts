import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { CreateVersionDto } from "@mfo-common";
import { toast } from "sonner";

const PROJECTION_QUERY_KEY = ["projection"];

export const useProjection = (simulationId: string) => {
  const queryClient = useQueryClient();
  const {
    data: projectionData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [PROJECTION_QUERY_KEY, simulationId],
    queryFn: async () => {
      const response = await api.get(`/api/projections/${simulationId}`);

      return response.data.map((item: any) => ({
        year: item.year,
        wealth: parseFloat(item.wealth),
        cashFlow: parseFloat(item.cashFlow),
        insuranceReceived: item.insuranceReceived ? parseFloat(item.insuranceReceived) : 0,
      }));
    },
  });

  const createNewVersion = useMutation({
    mutationFn: async (payload: CreateVersionDto) => {
      return await api.post(`/api/projections/${simulationId}/version`, payload);
    },
    onSuccess: () => {
      toast.success("Nova versão criada.");
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
    onError: () => toast.error("Erro ao criar nova versão."),
  });

  return {
    projectionData,
    isLoading,
    isError,
    refetch,
    createNewVersion,
  };
};
