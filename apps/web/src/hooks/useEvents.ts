import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CreateEventDto } from "@mfo-common";
import { FinancialEvent } from "@/types/event";
import { useAiAnalysis } from "./useAiAnalysis";

const EVENTS_QUERY_KEY = ["events"];
const PROJECTION_QUERY_KEY = ["projection"];

export const useEvents = (simulationId: string) => {
  const queryClient = useQueryClient();
  const { markAnalysisAsStale } = useAiAnalysis(simulationId);

  const { data: events, isLoading } = useQuery({
    queryKey: [EVENTS_QUERY_KEY, simulationId],
    queryFn: async () => {
      const response = await api.get<FinancialEvent[]>(`/api/simulations/${simulationId}/events`);
      return response.data;
    },
    enabled: !!simulationId,
  });

  const createEvent = useMutation({
    mutationFn: async (data: CreateEventDto) => {
      return await api.post(`/api/simulations/${simulationId}/events`, data);
    },
    onSuccess: () => {
      toast.success("Evento salvo com sucesso!");
      markAnalysisAsStale();
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
    onError: () => toast.error("Erro ao salvar evento."),
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      return await api.delete(`/api/simulations/${simulationId}/events/${eventId}`);
    },
    onSuccess: () => {
      toast.success("Evento removido.");
      markAnalysisAsStale();
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY, simulationId] });
      queryClient.invalidateQueries({ queryKey: [PROJECTION_QUERY_KEY, simulationId] });
    },
  });

  return {
    events,
    isLoading,
    createEvent,
    deleteEvent,
  };
};
