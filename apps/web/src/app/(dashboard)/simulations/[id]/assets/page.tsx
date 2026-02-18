"use client";

import { useParams } from "next/navigation";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Spinner } from "@components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, PlusCircle, Building2, TrendingUp } from "lucide-react";
import { CreateAssetDto, CreateAssetSchema } from "@mfo-common";
import { useForm } from "react-hook-form";

import { useAssets } from "@/hooks/useAssets";

import { AssetType } from "@/types/asset";

export default function AssetsPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const { assets, isLoading, createAsset, deleteAsset } = useAssets(simulationId);

  const form = useForm<CreateAssetDto>({
    resolver: zodResolver(CreateAssetSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split("T")[0] as unknown as Date,
      type: "FINANCEIRO",
      value: 0,
      isFinanced: false,
      installments: 0,
      interestRate: 0,
      downPayment: 0,
    },
  });

  const assetType = form.watch("type");
  const isFinanced = form.watch("isFinanced");

  const onSubmit = (data: CreateAssetDto) => {
    if (!data.isFinanced) {
      data.installments = 0;
      data.interestRate = 0;
      data.downPayment = 0;
    }

    const payload = {
      ...data,
      date: new Date(data.date),
    };

    createAsset.mutate(payload, {
      onSuccess: () => {
        form.reset({
          name: "",
          date: new Date().toISOString().split("T")[0] as unknown as Date,
          type: "FINANCEIRO",
          value: 0,
          isFinanced: false,
          installments: 0,
          interestRate: 0,
          downPayment: 0,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground/80">Gestão de ativos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit border-t-5 rounded-t-sm rounded-b-xl border-t-purple-500">
          <CardHeader className="border-b-2 pb-4">
            <CardTitle className="text-foreground/80">Novo Ativo</CardTitle>
            <CardDescription className="text-muted-foreground">Registre ativos e bens ao portfólio</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("ERROS DE VALIDAÇÃO:", errors))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700">Tipo de Alocação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-11 text-foreground/80 rounded-xl">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FINANCEIRO">Financeiro (Ações, Cripto, etc)</SelectItem>
                          <SelectItem value="IMOBILIZADO">Imobilizado (Imóveis, Veículos)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700">Nome / Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Carteira NuInvest ou Ap. Jardins" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700">Data de Aquisição / Referência</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value as unknown as string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700">Valor Total de Mercado (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {assetType === "IMOBILIZADO" && (
                  <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                    <FormField
                      control={form.control}
                      name="isFinanced"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">Este bem é financiado?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {isFinanced && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <FormField
                          control={form.control}
                          name="downPayment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Valor da Entrada (R$)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="installments"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Parcelas (Qtd)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="interestRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Juros (% a.a)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={createAsset.isPending}>
                  {createAsset.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ativo
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground/80">Carteira de Ativos</CardTitle>
            <CardDescription className="text-muted-foreground">Diversificação de ativos financeiros e imobilizados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner />
            ) : assets?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">Nenhum ativo cadastrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12.5">Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets?.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        {asset.type === AssetType.IMOBILIZADO ? (
                          <Building2 className="h-4 w-4 text-purple-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="text-foreground/80">{asset.name}</span>
                        <div className="text-xs text-muted-foreground mt-1">{format(new Date(asset.date), "dd/MM/yyyy")}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {asset.isFinanced ? (
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                            Financ. {asset.installments}x (Entrada:
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(asset.downPayment))})
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-foreground/80 font-semibold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(asset.value)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAsset.mutate(asset.id!)}
                          className="text-foreground/50 rounded-xl hover:text-red-500"
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
