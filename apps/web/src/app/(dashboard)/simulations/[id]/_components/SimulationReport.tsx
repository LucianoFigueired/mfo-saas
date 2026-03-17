"use client";

import React, { forwardRef } from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import ReactMarkdown from "react-markdown";

interface SimulationReportProps {
  simulation: any;
  projectionData: any[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export const SimulationReport = forwardRef<HTMLDivElement, SimulationReportProps>(({ simulation, projectionData }, ref) => {
  const latestAnalysis = simulation.aiAnalyses?.[0];

  return (
    <div className="hidden">
      <div ref={ref} className="print:block p-10 bg-white text-foreground w-[210mm] min-h-[297mm]">
        <div className="border-b-2 border-gray-800 pb-4 mb-8">
          <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900">Relatório Patrimonial</h1>
          <h2 className="text-lg font-semibold text-gray-600 mt-2">Família: {simulation.client?.name || simulation.name}</h2>
          <div className="flex justify-between text-sm text-gray-500 mt-4">
            <span>
              Cenário: {simulation.name} (v{simulation.version})
            </span>
            <span>Data: {new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold pb-2 mb-4 text-gray-600">Evolução Patrimonial Projetada</h3>
          <div className="w-full h-87.5">
            <AreaChart width={700} height={350} data={projectionData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(val) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(val)}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Legend
                align="right"
                wrapperStyle={{ fontSize: "12px", paddingTop: "40px" }}
                formatter={(value) => (
                  <span className="text-gray-600 font-medium">{value === "wealth" ? "Patrimônio Nominal" : "Patrimônio Real"}</span>
                )}
              />
              <Area
                name="wealth"
                type="monotone"
                dataKey="wealth"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="#eff6ff"
                isAnimationActive={false}
              />
              {projectionData[0]?.realWealth && (
                <Area
                  name="realWealth"
                  type="monotone"
                  dataKey="realWealth"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="#ecfdf5"
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10 page-break-inside-avoid">
          <div>
            <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-600">Ativos Atuais</h3>
            {simulation.assets?.length === 0 ? (
              <p className="text-sm text-gray-500">Sem ativos.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {simulation.assets?.map((asset: any) => (
                  <li key={asset.id} className="flex justify-between">
                    <span className="text-gray-700">{asset.name}</span>
                    <span className="font-semibold">{formatCurrency(asset.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-600">Seguros e Proteções</h3>
            {simulation.insurances?.length === 0 ? (
              <p className="text-sm text-gray-500">Sem seguros.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {simulation.insurances?.map((ins: any) => (
                  <li key={ins.id} className="flex justify-between">
                    <span className="text-gray-700">{ins.name}</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(ins.insuredValue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mb-10 page-break-inside-avoid">
          <h3 className="text-lg font-bold pb-2 mb-4 text-gray-600">Principais Movimentações</h3>
          <table className="w-full text-sm text-left mt-4">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">Descrição</th>
                <th className="py-2">Tipo</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {simulation.events?.map((event: any) => (
                <tr key={event.id}>
                  <td className="py-2 text-gray-800">{event.name}</td>
                  <td className="py-2">{event.type}</td>
                  <td className={`py-2 text-right font-semibold ${event.type === "ENTRADA" ? "text-green-600" : "text-red-600"}`}>
                    {event.type === "SAIDA" ? "- " : "+ "}
                    {formatCurrency(event.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {latestAnalysis && (
          <div className="print:break-before-page">
            <h3 className="text-2xl font-bold border-b-2 border-purple-200 pb-2 mb-6 text-purple-900">Diagnóstico Inteligente IA</h3>

            <div className="space-y-6 text-sm text-gray-800">
              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-2">Resumo Executivo</h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{latestAnalysis.summary}</ReactMarkdown>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-red-800 mb-2">Riscos Identificados</h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{latestAnalysis.risks}</ReactMarkdown>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-emerald-800 mb-2">Plano de Ação e Recomendações</h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{latestAnalysis.suggestions}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400">
          Gerado por Zelo Multi-Family Office • Software de Planejamento Patrimonial
        </div>
      </div>
    </div>
  );
});

SimulationReport.displayName = "SimulationReport";
