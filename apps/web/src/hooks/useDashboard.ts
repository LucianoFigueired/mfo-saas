import { api } from "@/lib/api";
import { Task } from "@/types/task";
import { useQuery } from "@tanstack/react-query";

export type DashboardOverview = {
  kpis: {
    aum: number;
    families: number;
    scenarios: number;
    scenariosThisMonth: number;
    monthlyGrowth: number;
  };
  charts: {
    aumSeries: Array<{ month: string; aum: number }>;
    allocation: Array<{ name: "FINANCEIRO" | "IMOBILIZADO"; value: number }>;
  };
  alerts: {
    critical: Task[];
    today: Task[];
  };
  recent: {
    clients: Array<{ id: string; name: string; createdAt: string }>;
    simulations: Array<{
      id: string;
      name: string;
      updatedAt: string;
      client: { id: string; name: string };
    }>;
  };
};

export const useDashboardOverview = () => {
  const { data, isLoading, isError, refetch } = useQuery<DashboardOverview>({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const response = await api.get("/api/dashboard/overview");
      return response.data;
    },
  });

  return { data, isLoading, isError, refetch };
};

