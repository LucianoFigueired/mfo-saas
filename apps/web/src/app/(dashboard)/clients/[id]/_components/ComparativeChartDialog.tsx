"use client";

import { useQueries } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ComparativeChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actualSimulation: any;
  selectedSimulations: any[];
}

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const CHART_COLORS = ["#d902ca", "#039c2c", "#047ae0"];

export function ComparativeChartDialog({ open, onOpenChange, actualSimulation, selectedSimulations }: ComparativeChartDialogProps) {
  const scenariosToCompare = actualSimulation ? [actualSimulation, ...selectedSimulations] : selectedSimulations;

  const projectionQueries = useQueries({
    queries: scenariosToCompare.map((sim) => ({
      queryKey: ["projection", sim.id],
      queryFn: async () => {
        const response = await api.get(`/api/projections/${sim.id}`);
        return { simId: sim.id, name: sim.name, data: response.data };
      },
      enabled: open,
    })),
  });

  const isLoading = projectionQueries.some((q) => q.isLoading);
  const isError = projectionQueries.some((q) => q.isError);

  let mergedData: any[] = [];

  if (!isLoading && !isError && projectionQueries.length > 0) {
    const baseProjections = projectionQueries[0]?.data?.data || [];

    mergedData = baseProjections.map((baseYearData: any) => {
      const yearObj: any = { year: baseYearData.year };

      projectionQueries.forEach((query) => {
        if (query.data) {
          const matchingYear = query.data.data.find((d: any) => d.year === baseYearData.year);
          yearObj[query.data.simId] = matchingYear ? parseFloat(matchingYear.wealth) : 0;
        }
      });
      return yearObj;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-250">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-foreground/80 mr-2" />
            <span className="text-foreground/80">Comparativo de Cenários</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Avaliando a evolução patrimonial entre a situação atual e os cenários projetados
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 h-112.5 w-full">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Calculando projeções comparativas...</p>
            </div>
          ) : isError ? (
            <div className="h-full flex items-center justify-center text-destructive">Erro ao carregar os dados das projeções.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <defs>
                  {scenariosToCompare.map((sim, index) => {
                    const color = CHART_COLORS[index % CHART_COLORS.length];
                    return (
                      <linearGradient key={`color-${sim.id}`} id={`color-${sim.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fontSize: 14 }}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatCompactCurrency}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fontSize: 14 }}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                          <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Ano {label}</p>
                          <div className="space-y-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />

                {scenariosToCompare.map((sim, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <Area
                      key={sim.id}
                      type="monotone"
                      dataKey={sim.id}
                      name={sim.name}
                      stroke={color}
                      fill={`url(#color-${sim.id})`}
                      strokeWidth={sim.name === "Situação Atual" ? 3 : 2}
                      strokeDasharray={sim.name === "Situação Atual" ? "0" : "5 5"}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
