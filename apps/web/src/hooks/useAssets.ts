// @/hooks/use-assets.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CreateAssetDto } from "@mfo-common";
import { Asset } from "@/types/asset";
import { useAiAnalysis } from "./useAiAnalysis";

const ASSETS_QUERY_KEY = ["assets"];
const PROJECTION_QUERY_KEY = ["projection"];

export const useAssets = (simulationId: string) => {
  const queryClient = useQueryClient();
  const { markAnalysisAsStale } = useAiAnalysis(simulationId);

  const { data: assets, isLoading } = useQuery({
    queryKey: [ASSETS_QUERY_KEY, simulationId],
    queryFn: async () => {
      const response = await api.get<Asset[]>(`/api/simulations/${simulationId}/assets`);
      return response.data;
    },
    enabled: !!simulationId,
  });

  const createAsset = useMutation({
    mutationFn: async (data: CreateAssetDto) => {
      return await api.post(`/api/simulations/${simulationId}/assets`, data);
    },
    onSuccess: () => {
      toast.success("Ativo adicionado com sucesso!");
      markAnalysisAsStale();
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
    onError: () => toast.error("Erro ao criar ativo."),
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      return await api.delete(`/api/assets/${assetId}`);
    },
    onSuccess: () => {
      toast.success("Ativo removido.");
      markAnalysisAsStale();
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...data }: Asset) => {
      if (!id) throw new Error("ID é necessário para atualização");
      return await api.put(`/api/assets/${id}`, data);
    },
    onSuccess: () => {
      toast.success("Ativo atualizado.");
      markAnalysisAsStale();
      queryClient.invalidateQueries({ queryKey: [ASSETS_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
  });

  return {
    assets,
    isLoading,
    createAsset,
    deleteAsset,
    updateAsset,
  };
};
