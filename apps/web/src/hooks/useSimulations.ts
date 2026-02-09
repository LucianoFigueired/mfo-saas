import { api } from "@/lib/api";
import { Simulation } from "@/types/simulation";
import { CreateSimulationDto } from "@mfo-common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SIULATIONS_QUERY_KEY = ["simulations"];

export const useSimulation = () => {
  const queryClient = useQueryClient();

  const {
    data: simulations,
    isLoading,
    isError,
    refetch,
  } = useQuery<Simulation[]>({
    queryKey: SIULATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get("/api/simulations");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (simulation: CreateSimulationDto) => {
      const { data } = await api.post("/api/simulations", simulation);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar simulação: ${error}`);
    },
  });

  return {
    simulations,
    isLoading,
    isError,
    refetch,
    createMutation,
  };
};
