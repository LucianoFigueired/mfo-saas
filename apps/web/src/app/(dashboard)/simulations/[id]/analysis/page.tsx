"use client";

import { useParams } from "next/navigation";

import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { AlertTriangle, Lightbulb, FileText, Loader2, RefreshCcw, BrainCircuit } from "lucide-react";

import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { ThinkingLoader } from "@/components/ThinkingLoader";
import { useEffect, useState } from "react";

export default function AnalysisPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const { analysis, isLoading, isAnalyzing } = useAiAnalysis(simulationId);

  const [showThinking, setShowThinking] = useState(true);

  useEffect(() => {
    if (isAnalyzing) {
      setShowThinking(true);
    } else {
      const timer = setTimeout(() => {
        setShowThinking(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAnalyzing]);

  if (isLoading) {
    return <AnalysisSkeleton />;
  }

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
            <BrainCircuit className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground/80 tracking-tight mb-1">Diagnóstico Inteligente</h2>
            <p className="text-sm text-muted-foreground">Análise de sensibilidade e riscos baseada no seu cenário atual.</p>
          </div>
        </div>

        {showThinking && (
          <Badge
            variant="secondary"
            className="gap-2 py-2 px-4 bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 transition-all"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <ThinkingLoader />
          </Badge>
        )}
      </div>

      {showThinking && !analysis ? (
        <AnalysisSkeleton />
      ) : !analysis ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma análise gerada ainda. Faça uma simulação para iniciar.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" /> Resumo Executivo
            </TabsTrigger>
            <TabsTrigger value="risks" className="gap-2 data-[state=active]:text-red-600">
              <AlertTriangle className="h-4 w-4" /> Riscos Identificados
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2 data-[state=active]:text-green-600">
              <Lightbulb className="h-4 w-4" /> Sugestões Táticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="animate-in fade-in slide-in-from-left-2">
            <Card className="border-indigo-100 shadow-sm">
              <CardHeader className="bg-indigo-50/60 px-6 py-2">
                <CardTitle className="text-indigo-800">Visão Geral do Patrimônio</CardTitle>
                <CardDescription>Análise gerada em {new Date(analysis.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 prose prose-indigo max-w-none dark:prose-invert">
                <p className="text-sm text-gray-700">{analysis.summary}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="animate-in fade-in slide-in-from-left-2">
            <Card className="border-red-100 shadow-sm">
              <CardHeader className="bg-red-50/50 px-6 py-2">
                <CardTitle className="text-red-800">Pontos de Atenção</CardTitle>
                <CardDescription>Cenários de estresse e vulnerabilidades detectadas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 prose prose-red max-w-none dark:prose-invert">
                <ul className="space-y-2 list-disc px-4">
                  {analysis.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="animate-in fade-in slide-in-from-left-2">
            <Card className="border-green-100 shadow-sm">
              <CardHeader className="bg-green-50/50 px-6 py-2">
                <CardTitle className="text-green-800">Plano de Ação</CardTitle>
                <CardDescription>Recomendações para otimizar sua longevidade financeira.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 prose prose-red max-w-none dark:prose-invert">
                <ul className="space-y-2 list-disc px-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-100 w-full rounded-xl" />
    </div>
  );
}
