"use client";

import { useEffect } from "react";

import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { CreateSimulationDto, CreateSimulationSchema } from "@mfo-common";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/components/@repo/@mfo/common/lib/utils";

import { api } from "@/lib/api";

interface EditSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulation: any;
}

export function EditSimulationDialog({ open, onOpenChange, simulation }: EditSimulationDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateSimulationDto>({
    resolver: zodResolver(CreateSimulationSchema) as any,
    defaultValues: {
      name: "",
      baseTax: 0,
      status: "VIVO",
      startDate: new Date().toISOString(),
    },
  });

  useEffect(() => {
    if (simulation && open) {
      form.reset({
        name: simulation.name,
        baseTax: Number(simulation.baseTax) * 100,
        status: simulation.status,
        startDate: simulation.startDate,
      });
    }
  }, [simulation, open, form]);

  const updateSimulation = useMutation({
    mutationFn: async (data: CreateSimulationDto) => {
      const payload = {
        ...data,
        baseTax: Number(data.baseTax) / 100,
      };
      await api.patch(`/api/simulations/${simulation.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulation", simulation.id] });
      toast.success("Simulação atualizada com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar simulação.");
    },
  });

  function onSubmit(data: CreateSimulationDto) {
    updateSimulation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160">
        <DialogHeader className="mb-4">
          <DialogTitle>Editar Detalhes</DialogTitle>
          <DialogDescription>Altere as premissas macroeconômicas desta versão da simulação.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Família / Cenário</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Família Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-7 gap-4 items-baseline">
              <FormField
                control={form.control}
                name="baseTax"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Taxa Real (% a.a.)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          className="pr-8"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                        <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col col-span-2">
                    <FormLabel>Início da Projeção</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full px-4 h-11 rounded-xl text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date("1900-01-01")}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full min-h-11 rounded-xl">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VIVO">Vivo</SelectItem>
                        <SelectItem value="MORTO">Morto</SelectItem>
                        <SelectItem value="INVALIDO">Inválido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">Define regras de sucessão e seguros.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateSimulation.isPending}>
                {updateSimulation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
