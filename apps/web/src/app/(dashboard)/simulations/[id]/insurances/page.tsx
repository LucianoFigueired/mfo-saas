"use client";

import { useParams } from "next/navigation";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Spinner } from "@components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { format, addMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, ShieldAlert, Trash2, PlusCircle, CalendarClock } from "lucide-react";
import { CreateInsuranceDto, CreateInsuranceSchema } from "@mfo-common";
import { useForm } from "react-hook-form";

import { useInsurances } from "@/hooks/useInsurances";

export default function InsurancesPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const { insurances, isLoading, createInsurance, deleteInsurance } = useInsurances(simulationId);

  const form = useForm<CreateInsuranceDto>({
    resolver: zodResolver(CreateInsuranceSchema),
    defaultValues: {
      startDate: new Date().toISOString().split("T")[0] as any,
      duration: 120,
      insuredValue: 0,
      premium: 0,
      name: "",
    },
  });

  const watchStartDate = form.watch("startDate");
  const watchDuration = form.watch("duration");

  const calculateEndDate = () => {
    if (!watchStartDate || !watchDuration) return null;
    return addMonths(new Date(watchStartDate), Number(watchDuration));
  };

  const endDatePreview = calculateEndDate();

  const onSubmit = (data: CreateInsuranceDto) => {
    const payload = {
      ...data,
      startDate: new Date(data.startDate),
    };

    createInsurance.mutate(payload, {
      onSuccess: () => {
        form.reset({
          startDate: new Date().toISOString().split("T")[0] as any,
          duration: 120,
          insuredValue: 0,
          premium: 0,
          name: "",
        });
      },
    });
  };

  const getStatus = (start: Date | string, duration: number) => {
    const startDateObj = new Date(start);
    const end = addMonths(startDateObj, duration);
    const isValid = isAfter(end, new Date());
    return isValid
      ? { label: "Ativo", color: "text-green-600", icon: ShieldCheck }
      : { label: "Expirado", color: "text-gray-400", icon: ShieldAlert };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl text-foreground/80 font-bold tracking-tight">Proteção & Seguros</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit border-t-5 rounded-t-sm rounded-b-xl border-t-blue-500">
          <CardHeader className="border-b-2 pb-4">
            <CardTitle className="text-foreground/80">Nova Apólice</CardTitle>
            <CardDescription>Seguro de Vida ou Invalidez</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora / Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Prudential Vida Inteira" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuredValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Cobertura (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : e.target.valueAsNumber;
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <CardDescription className="text-[10px]">Valor pago aos beneficiários em caso de sinistro.</CardDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="premium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prêmio / Custo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : e.target.valueAsNumber;
                            field.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início Vigência</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? String(field.value).split("T")[0] : ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (Meses)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : e.target.valueAsNumber;
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {endDatePreview && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    <span>
                      Cobertura até: <strong className="text-foreground/80">{format(endDatePreview, "MMM/yyyy", { locale: ptBR })}</strong>
                    </span>
                  </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createInsurance.isPending}>
                  {createInsurance.isPending ? (
                    <Spinner />
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Proteção
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground/80">Apólices Ativas</CardTitle>
            <CardDescription>Registro de apólices em vigor e proteção ativa do patrimônio</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner />
            ) : insurances?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Nenhuma proteção cadastrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12.5">Status</TableHead>
                    <TableHead>Seguradora</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="text-right">Cobertura</TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurances?.map((ins) => {
                    const status = getStatus(ins.startDate, ins.duration);
                    const Icon = status.icon;

                    return (
                      <TableRow key={ins.id}>
                        <TableCell>
                          <Icon className={`h-5 w-5 ${status.color}`} />
                        </TableCell>
                        <TableCell className="font-medium text-foreground/80">{ins.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ins.startDate), "MM/yy")} até {format(addMonths(new Date(ins.startDate), ins.duration), "MM/yy")}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground/70">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(ins.insuredValue)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInsurance.mutate(ins.id!)}
                            className="hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="p-4 text-foreground/80">
                      Cobertura Total em caso de Morte
                    </TableCell>
                    <TableCell className="text-right text-blue-800">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(insurances?.reduce((acc, curr) => acc + Number(curr.insuredValue), 0) || 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
