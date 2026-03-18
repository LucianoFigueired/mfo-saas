import { api } from "@/lib/api";
import { Product } from "@/types/product";
import { CreateProductDto, UpdateProductDto } from "@mfo-common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PRODUCTS_QUERY_KEY = ["products"];

export const useProducts = (productId?: string, q?: string) => {
  const queryClient = useQueryClient();

  const { data: products, isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: [...PRODUCTS_QUERY_KEY, q || ""],
    queryFn: async () => {
      const response = await api.get("/api/products", { params: q ? { q } : undefined });
      return response.data;
    },
  });

  const createProduct = useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const { data } = await api.post("/api/products", dto);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Produto criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar produto."),
  });

  const updateProduct = useMutation({
    mutationFn: async (dto: UpdateProductDto) => {
      const { data } = await api.patch(`/api/products/${productId}`, dto);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar produto."),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/products/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Produto removido.");
    },
    onError: () => toast.error("Erro ao remover produto."),
  });

  return {
    products,
    isLoading,
    isError,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

