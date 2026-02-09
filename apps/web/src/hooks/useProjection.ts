import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

const PROJECTION_QUERY_KEY = ["projection"];

export const useProjection = (simulationId: string) => {
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

  return {
    projectionData,
    isLoading,
    isError,
    refetch,
  };
};
