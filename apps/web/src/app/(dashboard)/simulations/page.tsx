"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Input } from "@components/ui/input";
import { Skeleton } from "@components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, MoreHorizontal, FileText, Trash2, ExternalLink, ArchiveRestore } from "lucide-react";

import { useSimulation } from "@/hooks/useSimulations";

export default function SimulationsPage() {
  const [search, setSearch] = useState("");

  const router = useRouter();

  const { simulations, isLoading, isError } = useSimulation();

  console.log(simulations);

  const filteredSimulations = simulations?.filter((sim) => sim.name.toLowerCase().includes(search.toLowerCase()));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VIVO":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Vivo</Badge>;
      case "MORTO":
        return <Badge variant="destructive">Sucessão (Morto)</Badge>;
      case "INVALIDO":
        return (
          <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white">
            Invalidez
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b-2 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Simulações</h1>
          <p className="text-muted-foreground">Gerencie as simulações de cenários patrimoniais.</p>
        </div>
        <Button onClick={() => router.push("/simulations/new")} className="font-semibold">
          <Plus className="mr-2 h-4 w-4" strokeWidth={3} /> Nova Simulação
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full bg-white max-w-sm">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome da família..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-75">Família / Simulação</TableHead>
              <TableHead>Status do Cenário</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Rentabilidade Base</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-6 w-50" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-15" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-30" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                  Erro ao carregar simulações. Verifique sua conexão.
                </TableCell>
              </TableRow>
            ) : filteredSimulations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhuma simulação encontrada. Comece criando uma nova.
                </TableCell>
              </TableRow>
            ) : (
              filteredSimulations?.map((sim) => (
                <TableRow
                  key={sim.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/simulations/${sim.id}/projection`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm">{sim.name}</span>
                      {sim.description && <span className="text-xs text-muted-foreground">{sim.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(sim.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">v{sim.version}</Badge>
                  </TableCell>
                  <TableCell>{(Number(sim.baseTax) * 100).toFixed(2)}% a.a.</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(sim.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="text-muted-foreground cursor-pointer hover:bg-muted"
                          onClick={() => router.push(`/simulations/${sim.id}/projection`)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" /> Abrir detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer hover:bg-red-100">
                          <ArchiveRestore className="mr-2 h-4 w-4 text-red-600" /> Arquivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
