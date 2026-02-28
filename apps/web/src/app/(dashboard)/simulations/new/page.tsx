"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Spinner } from "@components/ui/spinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, CalendarIcon } from "lucide-react";
import { CreateSimulationDto, CreateSimulationSchema } from "@mfo-common";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { cn } from "@/components/@repo/@mfo/common/lib/utils";

import { useSimulation } from "@/hooks/useSimulations";
import { useEffect } from "react";

export default function NewSimulationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("clientId");

  const { createSimulation } = useSimulation();

  const form = useForm<CreateSimulationDto>({
    resolver: zodResolver(CreateSimulationSchema) as any,
    defaultValues: {
      name: "",
      baseTax: 4.0,
      status: "VIVO",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (clientId) {
      form.setValue("clientId", clientId);
    }
  }, [clientId, form]);

  async function onSubmit(data: CreateSimulationDto) {
    if (!clientId) {
      toast.error("Erro: Nenhum cliente selecionado para esta simulação");
      return;
    }
    const payload = {
      ...data,
      baseTax: Number(data.baseTax) / 100,
      clientId: clientId || "",
    };

    console.log(payload);

    createSimulation.mutate(payload, {
      onSuccess: (response) => {
        router.push(`/simulations/${response.id}/projection`);
      },
      onError: () => {
        toast.error("Não foi possível criar a simulação. Verifique os dados.");
      },
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="rounded-xl" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-foreground/80">Nova Simulação</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="mb-2 border-b-2 pt-2 pb-4">
              <CardTitle className="text-foreground/80">Parâmetros Iniciais</CardTitle>
              <CardDescription>Defina algumas informações iniciais da simulação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cenário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cenário Conservador" {...field} />
                    </FormControl>
                    <FormDescription>Use um nome que facilite a busca posteriormente.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="baseTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Real de Longo Prazo (% a.a.)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            className="pr-8"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                          <span className="absolute right-3 top-3 text-sm text-muted-foreground">%</span>
                        </div>
                      </FormControl>
                      <FormDescription>Rentabilidade média acima da inflação.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início da Projeção</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full h-11 rounded-xl px-4 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(new Date(field.value), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            locale={ptBR}
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Patriarca/Matriarca</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VIVO">Vivo (Fluxo Normal)</SelectItem>
                        <SelectItem value="MORTO">Morto (Simular Sucessão)</SelectItem>
                        <SelectItem value="INVALIDO">Inválido (Simular Invalidez)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Isso ativa as regras de gatilho para seguros e redução de despesas no motor de cálculo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSimulation.isPending}>
              {createSimulation.isPending ? (
                <Spinner />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Criar Simulação e Ir para Projeção
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
