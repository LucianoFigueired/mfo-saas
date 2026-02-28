"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Calculator, Calendar, Mail, Phone, BarChart2, ChartSpline, BookUser, Plus, AtSign } from "lucide-react";

import { useClient } from "@/hooks/useClients";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { ComparativeChartDialog } from "./_components/ComparativeChartDialog";

export default function ClientDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { client, isLoading } = useClient(clientId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <Button className="mt-4" onClick={() => router.push("/clients")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  const actualSimulation = client.simulations?.find((s: any) => s.name === "Situação Atual" || s.version === 1);
  const selectedSimulations = client.simulations?.filter((s: any) => selectedIds.includes(s.id)) || [];

  const handleToggleSelection = (id: string) => {
    if (actualSimulation && id === actualSimulation.id) {
      toast.info("A Situação Atual já é incluída no comparativo automaticamente.");
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        toast.warning("Você pode selecionar no máximo 2 cenários alternativos.");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="rounded-xl" size="icon" onClick={() => router.push("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground/80">{client.name}</h2>
          <p className="text-muted-foreground">Painel da Família</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Simulações Ativas</CardTitle>
            <ChartSpline className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground/80">{client.simulations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contatos</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-sm flex items-center gap-2">
              <AtSign className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold text-foreground/70">{client.email || "Não informado"}</span>
            </div>
            <div className="text-sm flex items-center gap-2">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold text-foreground/70">{client.phone || "Não informado"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cliente Desde</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground/80">{new Date(client.createdAt).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      <ComparativeChartDialog
        open={isCompareModalOpen}
        onOpenChange={setIsCompareModalOpen}
        actualSimulation={actualSimulation}
        selectedSimulations={selectedSimulations}
      />

      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold tracking-tight text-foreground/80">Cenários Patrimoniais</h3>
            {selectedIds.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-primary/5 text-primary hover:bg-primary/15"
                onClick={() => setIsCompareModalOpen(true)}
              >
                <BarChart2 strokeWidth={3} className="mr-2 h-4 w-4" />
                <span>
                  Comparar <span>({selectedIds.length + 1})</span>
                </span>
              </Button>
            )}
          </div>

          <Button asChild>
            <Link href={`/simulations/new?clientId=${client.id}`}>
              <Plus className="mr-2 h-4 w-4 text-primary-foreground" strokeWidth={3} />
              <span className="font-bold text-primary-foreground">Nova Simulação</span>
            </Link>
          </Button>
        </div>

        <div className="border rounded-lg bg-card overflow-hidden">
          {!client.simulations || client.simulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
              <Calculator className="h-10 w-10 mb-4 opacity-20" />
              Nenhum cenário cadastrado para esta família.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead>Nome do Cenário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Rentabilidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.simulations.map((sim: any) => {
                  const isActual = actualSimulation?.id === sim.id;

                  return (
                    <TableRow key={sim.id} className={isActual ? "bg-muted/30" : ""}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isActual ? true : selectedIds.includes(sim.id)}
                          disabled={isActual}
                          onCheckedChange={() => handleToggleSelection(sim.id)}
                          className={isActual ? "opacity-50 cursor-not-allowed" : ""}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="mb-1">
                          <span className="text-foreground/80">{sim.name}</span>
                          {isActual && (
                            <span className="ml-2 text-[10px] uppercase text-emerald-500 rounded-lg font-bold tracking-wider">Atual</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Adicionado em {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${sim.status === "VIVO" ? "bg-emerald-500" : "bg-red-500"}`}>{sim.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-foreground/80 px-3 py-1">
                          v{sim.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground/80">{(Number(sim.baseTax) * 100).toFixed(2)}% a.a.</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/simulations/${sim.id}/projection`}>
                            <span className="text-xs text-foreground/80 font-semibold">Abrir Projeção</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
