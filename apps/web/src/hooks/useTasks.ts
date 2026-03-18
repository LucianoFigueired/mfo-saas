import { api } from "@/lib/api";
import { Task, TaskStatus } from "@/types/task";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const TASKS_QUERY_KEY = ["tasks"];

type Bucket = "overdue" | "today" | "week" | "all";

export const useTasks = (params?: { bucket?: Bucket; status?: TaskStatus }) => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, isError, refetch } = useQuery<Task[]>({
    queryKey: [...TASKS_QUERY_KEY, params?.bucket || "all", params?.status || "any"],
    queryFn: async () => {
      const response = await api.get("/api/tasks", {
        params: {
          ...(params?.bucket ? { bucket: params.bucket } : {}),
          ...(params?.status ? { status: params.status } : {}),
        },
      });
      return response.data;
    },
  });

  const createTask = useMutation({
    mutationFn: async (dto: {
      title: string;
      description?: string;
      dueDate: string;
      priority?: "LOW" | "MEDIUM" | "HIGH";
      status?: TaskStatus;
      clientId?: string;
    }) => {
      const { data } = await api.post("/api/tasks", dto);
      return data as Task;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success("Tarefa criada!");
    },
    onError: () => toast.error("Erro ao criar tarefa."),
  });

  const updateTask = useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Task> }) => {
      const { data } = await api.patch(`/api/tasks/${input.id}`, input.patch);
      return data as Task;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success("Tarefa atualizada.");
    },
    onError: () => toast.error("Erro ao atualizar tarefa."),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/tasks/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      toast.success("Tarefa removida.");
    },
    onError: () => toast.error("Erro ao remover tarefa."),
  });

  return {
    tasks,
    isLoading,
    isError,
    refetch,
    createTask,
    updateTask,
    deleteTask,
  };
};

