"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { ArrowUpRight, TrendingUp, Users, ChartArea, Activity, AlertCircle, Building2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";

import { useDashboardOverview } from "@/hooks/useDashboard";

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

const PIE_COLORS = {
  FINANCEIRO: "var(--chart-2)",
  IMOBILIZADO: "var(--chart-1)",
} as const;

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardOverview();

  const allocationTotal = useMemo(() => {
    const a = data?.charts.allocation || [];
    return a.reduce((acc, p) => acc + p.value, 0);
  }, [data?.charts.allocation]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="mt-2 h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar dashboard</AlertTitle>
        <AlertDescription>Não foi possível carregar os dados da Visão Geral.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/80">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Seu centro de comando: métricas, alertas e atividade recente.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/calendar">Ver tarefas</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/clients">
              Ver clientes <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AUM (Patrimônio sob gestão)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(data.kpis.aum)}</div>
            <p className="text-xs text-muted-foreground">Soma dos ativos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Famílias atendidas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.families}</div>
            <p className="text-xs text-muted-foreground">Clientes ativos na base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cenários geridos</CardTitle>
            <ChartArea className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.scenarios}</div>
            <p className="text-xs text-muted-foreground">{data.kpis.scenariosThisMonth} criados no mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crescimento mensal</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.kpis.monthlyGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {data.kpis.monthlyGrowth >= 0 ? "+" : "-"}
              {formatCompactCurrency(Math.abs(data.kpis.monthlyGrowth))}
            </div>
            <p className="text-xs text-muted-foreground">AUM atual vs. fim do mês passado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Patrimônio Gerido</CardTitle>
            <CardDescription>Últimos meses (AUM por mês)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.aumSeries} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorAum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="10%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} className="text-xs text-muted-foreground" />
                  <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} tickMargin={10} className="text-xs text-muted-foreground" />
                  <Tooltip
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    formatter={(v?: number | string) => formatCurrency(Number(v ?? 0))}
                    labelFormatter={(l) => `Mês ${l}`}
                  />
                  <Area type="monotone" dataKey="aum" name="AUM" stroke="var(--chart-2)" fill="url(#colorAum)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alocação Global</CardTitle>
            <CardDescription>Distribuição consolidada (Financeiro vs Imobilizado)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.charts.allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={4}>
                    {data.charts.allocation.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v?: number | string, n?: string) => {
                      const val = Number(v ?? 0);
                      const pct = allocationTotal > 0 ? (val / allocationTotal) * 100 : 0;
                      return [`${formatCurrency(val)} (${pct.toFixed(0)}%)`, String(n ?? "")];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Centro de Alertas</CardTitle>
            <CardDescription>Atenção imediata (próximos 7 dias)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.critical.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum alerta crítico no momento.</div>
            ) : (
              data.alerts.critical.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground/80">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Vence em {new Date(t.dueDate).toLocaleDateString("pt-BR")}
                      {t.client?.id && (
                        <>
                          {" "}
                          •{" "}
                          <Link href={`/clients/${t.client.id}`} className="underline underline-offset-4">
                            {t.client.name}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${t.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                    {t.priority === "HIGH" ? "Alta" : "Média/Baixa"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas de Hoje</CardTitle>
            <CardDescription>Para você não perder o foco</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.today.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma tarefa para hoje.</div>
            ) : (
              data.alerts.today.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground/80">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.client?.id ? (
                        <Link href={`/clients/${t.client.id}`} className="underline underline-offset-4">
                          {t.client.name}
                        </Link>
                      ) : (
                        "Sem cliente vinculado"
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{t.status === "IN_PROGRESS" ? "Em andamento" : "A fazer"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Acesso rápido ao que você mexeu por último</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground/80">Últimos clientes adicionados</div>
              <Separator />
              <div className="space-y-2">
                {data.recent.clients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <Link href={`/clients/${c.id}`} className="text-sm text-foreground/80 underline underline-offset-4">
                      {c.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                ))}
                {data.recent.clients.length === 0 && <div className="text-sm text-muted-foreground">Nenhum cliente.</div>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground/80">Últimas simulações editadas</div>
              <Separator />
              <div className="space-y-2">
                {data.recent.simulations.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm text-foreground/80">{s.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5" />
                        <Link href={`/clients/${s.client.id}`} className="underline underline-offset-4">
                          {s.client.name}
                        </Link>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link href={`/simulations/${s.id}/projection`}>Retomar</Link>
                    </Button>
                  </div>
                ))}
                {data.recent.simulations.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma simulação.</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
