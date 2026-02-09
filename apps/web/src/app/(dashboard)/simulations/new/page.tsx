"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function NewSimulationPage() {
  const router = useRouter();

  const { createMutation } = useSimulation();

  const form = useForm<CreateSimulationDto>({
    resolver: zodResolver(CreateSimulationSchema) as any,
    defaultValues: {
      name: "",
      baseTax: 4.0,
      status: "VIVO",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(data: CreateSimulationDto) {
    const payload = {
      ...data,
      baseTax: Number(data.baseTax) / 100,
    };

    createMutation.mutate(payload, {
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
        <Button variant="ghost" size="icon" asChild>
          <Link href="/simulations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nova Simulação</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Iniciais</CardTitle>
              <CardDescription>Defina as premissas macroeconômicas e o estado inicial da família.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Família / Cenário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Família Silva - Cenário Conservador" {...field} />
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
                          <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
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
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(new Date(field.value), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
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
