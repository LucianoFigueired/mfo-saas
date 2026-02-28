"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { ArrowLeft, GitBranch, SquarePen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { EditSimulationDialog } from "./_components/EditSimulationDialog";
import { NewVersionDialog } from "./_components/NewVersionDialog";

import { cn } from "@/components/@repo/@mfo/common/lib/utils";
import { api } from "@/lib/api";

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const simulationId = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);

  const { data: simulation, isLoading } = useQuery({
    queryKey: ["simulation", simulationId],
    queryFn: async () => {
      const res = await api.get(`/api/simulations/${simulationId}`);
      return res.data;
    },
  });

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
      <EditSimulationDialog open={isEditOpen} onOpenChange={setIsEditOpen} simulation={simulation} />

      <NewVersionDialog
        open={isNewVersionOpen}
        onOpenChange={setIsNewVersionOpen}
        currentSimulationName={simulation.name}
        simulationId={simulationId}
      />

      <div className="flex flex-col gap-4 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-xl cursor-pointer" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground/80 tracking-tight flex items-center gap-2">
                {simulation.name}
                <Badge className="ml-2 px-4 py-1 font-bold" variant={simulation.status === "VIVO" ? "default" : "destructive"}>
                  {simulation.status}
                </Badge>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                <span className="mr-1.5">Versão {simulation.version}</span>
                <span className="text-xs">•</span>
                <span className="ml-1.5">Criada em {new Date(simulation.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewVersionOpen(true)}>
              <GitBranch className="mr-2 h-4 w-4" />
              Nova Versão
            </Button>

            <Button size="sm" onClick={() => setIsEditOpen(true)}>
              <div className="flex items-center cursor-pointer">
                <SquarePen className="mr-2 h-4 w-4" />
                Alterar detalhes
              </div>
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <nav className="flex items-center space-x-4">
            {[
              { name: "Projeção", href: "projection" },
              { name: "Ativos", href: "assets" },
              { name: "Movimentações", href: "events" },
              { name: "Seguros", href: "insurances" },
              { name: "Análise IA", href: "analysis" },
            ].map((tab) => {
              const isActive = pathname.includes(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={`/simulations/${simulationId}/${tab.href}`}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors border-b-2",
                    isActive ? "border-primary border-b-3" : "border-transparent hover:text-foreground",
                  )}
                >
                  <span className={isActive ? "text-primary" : "text-muted-foreground"}>{tab.name}</span>
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
