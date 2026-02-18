"use client";

import { useRouter } from "next/navigation";

import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { CreateVersionSchema, CreateVersionDto } from "@mfo-common";
import { useForm } from "react-hook-form";

import { useProjection } from "@/hooks/useProjection";

interface NewVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSimulationName: string;
  simulationId: string;
}

export function NewVersionDialog({ open, onOpenChange, currentSimulationName, simulationId }: NewVersionDialogProps) {
  const router = useRouter();

  const { createNewVersion } = useProjection(simulationId);

  const form = useForm<CreateVersionDto>({
    resolver: zodResolver(CreateVersionSchema) as any,
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: CreateVersionDto) {
    createNewVersion.mutate(data, {
      onSuccess: (response) => {
        const newSimulationId = response.data.id;

        onOpenChange(false);
        form.reset();

        router.push(`/simulations/${newSimulationId}/projection`);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader className="mb-4">
          <DialogTitle>Criar Nova Versão</DialogTitle>
          <DialogDescription>
            Isso criará uma cópia exata do cenário atual (<strong>{currentSimulationName}</strong>) para você testar novas hipóteses sem
            perder os dados originais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Nova Versão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cenário com Aposentadoria Antecipada" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Dê um nome que identifique a diferença deste cenário.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createNewVersion.isPending}>
                {createNewVersion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Versão
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
