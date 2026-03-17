import { api } from "@/lib/api";
import { ScenarioTemplate } from "@/types/scenarioTemplate";
import { CreateScenarioTemplateDto, UpdateScenarioTemplateDto } from "@mfo-common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SCENARIO_TEMPLATES_QUERY_KEY = ["scenario-templates"];

export const useScenarioTemplates = (templateId?: string) => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading, isError, refetch } = useQuery<ScenarioTemplate[]>({
    queryKey: SCENARIO_TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get("/api/scenario-templates");
      return response.data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (dto: CreateScenarioTemplateDto) => {
      const { data } = await api.post("/api/scenario-templates", dto);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SCENARIO_TEMPLATES_QUERY_KEY });
      toast.success("Template criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar template."),
  });

  const updateTemplate = useMutation({
    mutationFn: async (dto: UpdateScenarioTemplateDto) => {
      const { data } = await api.patch(`/api/scenario-templates/${templateId}`, dto);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SCENARIO_TEMPLATES_QUERY_KEY });
      toast.success("Template atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar template."),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/scenario-templates/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SCENARIO_TEMPLATES_QUERY_KEY });
      toast.success("Template removido.");
    },
    onError: () => toast.error("Erro ao remover template."),
  });

  return {
    templates,
    isLoading,
    isError,
    refetch,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};

