"use client";

import { useParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useProjection } from "@/hooks/useProjection";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export default function ProjectionPage() {
  const params = useParams();
  const simulationId = params.id as string;

  const { projectionData, isLoading, isError } = useProjection(simulationId);

  if (isLoading) {
    return <ProjectionSkeleton />;
  }

  if (isError || !projectionData || projectionData.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro na Projeção</AlertTitle>
        <AlertDescription>
          Não foi possível calcular a projeção. Verifique se existem ativos cadastrados ou tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  const initialWealth = projectionData[0].wealth;
  const finalWealth = projectionData[projectionData.length - 1].wealth;
  const growth = finalWealth - initialWealth;
  const growthPercentage = ((finalWealth - initialWealth) / initialWealth) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Final (2060)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(finalWealth)}</div>
            <p className="text-xs text-muted-foreground">Projetado ao final do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{formatCompactCurrency(growth)}</div>
            <p className="text-xs text-muted-foreground">+{growthPercentage.toFixed(0)}% de rentabilidade acumulada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa Médio</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactCurrency(projectionData.reduce((acc: number, curr: any) => acc + curr.cashFlow, 0) / projectionData.length)}
              <span className="text-sm font-normal text-muted-foreground"> /ano</span>
            </div>
            <p className="text-xs text-muted-foreground">Média de entradas líquidas anuais</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Evolução Patrimonial</CardTitle>
          <CardDescription>Projeção linear considerando juros compostos e fluxo de caixa.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-100 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={projectionData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />

                <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={10} className="text-xs text-muted-foreground" />

                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs text-muted-foreground"
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Ano</span>
                              <span className="font-bold text-muted-foreground">{label}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Patrimônio</span>
                              <span className="font-bold text-primary">{formatCurrency(payload[0].value as number)}</span>
                            </div>
                            <div className="flex flex-col col-span-2 border-t pt-1 mt-1">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">Movimentações</span>
                              <span
                                className={`font-bold ${(payload[0].payload.cashFlow || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}
                              >
                                {formatCurrency(payload[0].payload.cashFlow)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area type="monotone" dataKey="wealth" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorWealth)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function ProjectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-112.5 w-full rounded-xl" />
    </div>
  );
}
