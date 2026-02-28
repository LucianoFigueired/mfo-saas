"use client";

import Link from "next/link";

import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Users, ChevronRight, ChartSpline } from "lucide-react";

import { CreateClientDialog } from "./_components/CreateClientDialog";

import { useClients } from "@/hooks/useClients";

export default function ClientsPage() {
  const { clients, isLoading } = useClients();

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between border-b-2 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Meus Clientes</h1>
          <p className="text-muted-foreground">Faça o gerenciamento e acesse as simulações de cada cliente</p>
        </div>
        <CreateClientDialog />
      </div>

      <div className="border rounded-lg bg-card">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground/50">Nenhum cliente cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-6 max-w-sm">
              Você ainda não possui clientes. Adicione uma primeira família para começar a montar projeções financeiras.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Cliente / Família</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Simulações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => (
                <TableRow key={client.id} className="group">
                  <TableCell className="font-medium">
                    <span>{client.name}</span>
                    <div className="text-xs text-muted-foreground mt-2">
                      Adicionado em {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.email || "Sem e-mail"}</div>
                    <div className="text-xs text-muted-foreground mt-2">{client.phone || "Sem telefone"}</div>
                  </TableCell>
                  <TableCell className="text-start">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <ChartSpline className="h-4 w-4" />
                      <span className="font-medium">{client._count?.simulations || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>
                          <span className="text-xs text-foreground/80 font-semibold">Acessar Dashboard</span>
                          <ChevronRight className="ml-2 h-4 w-4 text-foreground-80" />
                        </Link>
                      </Button>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
