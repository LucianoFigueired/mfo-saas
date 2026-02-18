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
            <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio Final (2060)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(finalWealth)}</div>
            <p className="text-xs text-muted-foreground">Projetado ao final do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crescimento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{formatCompactCurrency(growth)}</div>
            <p className="text-xs text-muted-foreground">+{growthPercentage.toFixed(0)}% de rentabilidade acumulada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fluxo de Caixa Médio</CardTitle>
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
          <CardDescription>Projeção linear considerando juros compostos e fluxo de caixa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-87.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="15%" stopColor="var(--chart-2)" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  className="text-xs font-medium text-muted-foreground"
                />
                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  className="text-xs font-medium text-muted-foreground"
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const { wealth, cashFlow } = payload[0].payload;
                      return (
                        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Projeção {label}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-muted-foreground">Patrimônio:</span>
                              <span className="text-sm font-bold text-foreground">{formatCurrency(wealth)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 pt-1.5 border-t">
                              <span className="text-xs text-muted-foreground">Fluxo:</span>
                              <span className={`text-xs font-bold ${cashFlow >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                                {cashFlow >= 0 ? "+" : ""} {formatCurrency(cashFlow)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="wealth"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorWealth)"
                  dot={{ r: 3, fill: "var(--background)", stroke: "var(--chart-2)", strokeWidth: 1 }}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "var(--chart-2)" }}
                  animationDuration={1500}
                />
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
