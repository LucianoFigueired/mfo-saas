import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateClientDto } from "@mfo-common";
import { toast } from "sonner";

const CLIENTS_QUERY_KEY = ["clients"];

export const useClients = () => {
  const queryClient = useQueryClient();

  const {
    data: clients,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [CLIENTS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/api/clients");
      return response.data;
    },
  });

  const createClient = useMutation({
    mutationFn: async (payload: CreateClientDto) => {
      return await api.post("/api/clients", payload);
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
    },
    onError: () => toast.error("Erro ao cadastrar cliente."),
  });

  return {
    clients,
    isLoading,
    isError,
    createClient,
  };
};

export const useClient = (clientId: string) => {
  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const response = await api.get(`/api/clients/${clientId}`);
      return response.data;
    },
    enabled: !!clientId,
  });

  return {
    client,
    isLoading,
    isError,
  };
};
