"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Trash2, PlusCircle, ArrowUpCircle, ArrowDownCircle, Infinity, MoveRight } from "lucide-react";
import { Spinner } from "@components/ui/spinner";

import { useEvents } from "@/hooks/useEvents";
import { CreateEventDto, CreateEventSchema } from "@mfo-common";
import { EventFrequency, EventType } from "@/types/event";

export default function EventsPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const { events, isLoading, createEvent, deleteEvent } = useEvents(simulationId);

  const form = useForm<CreateEventDto>({
    resolver: zodResolver(CreateEventSchema),
    defaultValues: {
      type: "ENTRADA",
      frequency: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0] as any,
      value: 0,
      name: "",
    },
  });

  const currentType = form.watch("type");
  const isIncome = currentType === "ENTRADA";

  const onSubmit = (data: CreateEventDto) => {
    const payload = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };

    createEvent.mutate(payload, {
      onSuccess: () => {
        form.reset({
          type: currentType,
          frequency: "MONTHLY",
          startDate: new Date().toISOString().split("T")[0] as any,
          value: 0,
          name: "",
          endDate: undefined,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground/80">Movimentações</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className={`lg:col-span-1 h-fit border-t-5 rounded-t-sm rounded-b-xl ${isIncome ? "border-t-green-500" : "border-t-red-500"}`}
        >
          <CardHeader className="border-b-2 pb-4">
            <CardTitle className="text-foreground/80">{isIncome ? "Nova Receita" : "Nova Despesa"}</CardTitle>
            <CardDescription>{isIncome ? "Salários, Dividendos, Aluguéis..." : "Custo de vida, Escola, Prestação..."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ENTRADA" className="data-[state=active]:text-green-700">
                              Entrada
                            </TabsTrigger>
                            <TabsTrigger value="SAIDA" className="data-[state=active]:text-red-700">
                              Saída
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isIncome ? "text-green-600" : "text-red-600"}>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder={isIncome ? "Ex: Salário Mensal" : "Ex: Mensalidade Escolar"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isIncome ? "text-green-600" : "text-red-600"}>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.valueAsNumber;
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isIncome ? "text-green-600" : "text-red-600"}>Frequência</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full min-h-11 rounded-xl">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Mensal</SelectItem>
                            <SelectItem value="YEARLY">Anual</SelectItem>
                            <SelectItem value="ONCE">Único</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isIncome ? "text-green-600" : "text-red-600"}>Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ? String(field.value).split("T")[0] : ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={isIncome ? "text-green-600" : "text-red-600"}>Fim (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ? String(field.value).split("T")[0] : ""} />
                      </FormControl>
                      <CardDescription className="text-[10px]">Deixe em branco se for vitalício.</CardDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className={`w-full ${isIncome ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? (
                    <Spinner />
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar {isIncome ? "Entrada" : "Saída"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground/80">Histórico de Movimentações</CardTitle>
            <CardDescription>Registro detalhado de toda a movimentação de entrada e saída</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner />
            ) : events?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Nenhum evento registrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12.5">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {isIncome ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground/80">{event.name}</TableCell>
                      <TableCell className="text-xs uppercase text-muted-foreground">
                        {event.frequency === EventFrequency.MONTHLY
                          ? "Mensal"
                          : event.frequency === EventFrequency.YEARLY
                            ? "Anual"
                            : "Único"}
                      </TableCell>
                      <TableCell className="text-xs flex pt-4 items-center">
                        <span className="mr-1 text-xs text-foreground/80">
                          {format(new Date(event.startDate), "MMM/yy", { locale: ptBR }).toUpperCase()}
                        </span>
                        <MoveRight size={16} />
                        {event.endDate ? (
                          <span className="text-sm text-foreground/80">
                            {format(new Date(event.endDate), "MMM/yy", { locale: ptBR }).toUpperCase()}
                          </span>
                        ) : (
                          <Infinity size={20} className="text-foreground/70 ml-1" />
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${event.type === EventType.ENTRADA ? "text-green-600" : "text-red-600"}`}>
                        {event.type === EventType.SAIDA ? "- " : "+ "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(event.value)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEvent.mutate(event.id!)}
                          className="text-foreground/50 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
