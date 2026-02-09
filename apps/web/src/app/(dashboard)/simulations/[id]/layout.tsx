"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

import { ArrowLeft, GitBranch, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/@repo/@mfo/common/components/ui/badge";
import { Button } from "@/components/@repo/@mfo/common/components/ui/button";
import { Skeleton } from "@/components/@repo/@mfo/common/components/ui/skeleton";
import { cn } from "@/components/@repo/@mfo/common/lib/utils";

import { api } from "@/lib/api";

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const simulationId = params.id as string;

  const { data: simulation, isLoading } = useQuery({
    queryKey: ["simulation", simulationId],
    queryFn: async () => {
      const res = await api.get(`/api/simulations/${simulationId}`);
      return res.data;
    },
  });

  const activeTab = pathname.split("/").pop();

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/simulations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {simulation.name}
                <Badge variant={simulation.status === "VIVO" ? "default" : "destructive"}>{simulation.status}</Badge>
              </h1>
              <p className="text-muted-foreground text-sm">
                Versão {simulation.version} • Criado em {new Date(simulation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <GitBranch className="mr-2 h-4 w-4" />
              Nova Versão
            </Button>
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <nav className="flex items-center space-x-4">
            {[
              { name: "Projeção", href: "projection" },
              { name: "Ativos", href: "assets" },
              { name: "Movimentações", href: "events" },
              { name: "Riscos & Seguros", href: "risk" },
              { name: "Análise IA", href: "analysis" },
            ].map((tab) => {
              const isActive = pathname.includes(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={`/simulations/${simulationId}/${tab.href}`}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors border-b-2",
                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="flex-1">{children}</main>
    </div>
  );
}
