"use client";

import { useMemo, useState } from "react";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Separator } from "@components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateScenarioTemplateDto, CreateScenarioTemplateSchema } from "@mfo-common";
import { type Resolver, useForm } from "react-hook-form";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useScenarioTemplates } from "@/hooks/useScenarioTemplates";
import { ScenarioTemplate } from "@/types/scenarioTemplate";

function toPercentString(decimalLike: string | number | null | undefined): number {
  const n = Number(decimalLike);
  if (Number.isNaN(n)) return 0;
  return n * 100;
}

function toDecimalFromPercentInput(v: number | undefined): number | undefined {
  if (v === undefined || Number.isNaN(v)) return undefined;
  return Number(v) / 100;
}

export default function ScenarioTemplatesPage() {
  const { templates, createTemplate, deleteTemplate } = useScenarioTemplates();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScenarioTemplate | null>(null);

  const { updateTemplate } = useScenarioTemplates(editing?.id);

  const form = useForm<CreateScenarioTemplateDto>({
    resolver: zodResolver(CreateScenarioTemplateSchema) as unknown as Resolver<CreateScenarioTemplateDto>,
    defaultValues: {
      name: "",
      description: "",
      baseTax: 4,
      inflation: 4,
      realEstateRate: 5,
      successionTax: 15,
    },
  });

  const sortedTemplates = useMemo(() => {
    return (templates || []).slice().sort((a, b) => (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, [templates]);

  function openCreate() {
    setEditing(null);
    form.reset({
      name: "",
      description: "",
      baseTax: 4,
      inflation: 4,
      realEstateRate: 5,
      successionTax: 15,
    });
    setOpen(true);
  }

  function openEdit(tpl: ScenarioTemplate) {
    setEditing(tpl);
    form.reset({
      name: tpl.name,
      description: tpl.description || "",
      baseTax: toPercentString(tpl.baseTax),
      inflation: toPercentString(tpl.inflation),
      realEstateRate: toPercentString(tpl.realEstateRate),
      successionTax: toPercentString(tpl.successionTax),
    });
    setOpen(true);
  }

  async function onSubmit(data: CreateScenarioTemplateDto) {
    const payload = {
      ...data,
      baseTax: toDecimalFromPercentInput(data.baseTax) ?? 0,
      inflation: toDecimalFromPercentInput(data.inflation) ?? 0,
      realEstateRate: toDecimalFromPercentInput(data.realEstateRate) ?? 0,
      successionTax: toDecimalFromPercentInput(data.successionTax) ?? 0,
    };

    if (editing) {
      await updateTemplate.mutateAsync(payload);
    } else {
      await createTemplate.mutateAsync(payload);
    }
    setOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/80">Templates de Cenários</h1>
          <p className="text-sm text-muted-foreground">Salve premissas macroeconômicas padrão para reutilizar em novas simulações.</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedTemplates.map((tpl) => (
          <Card key={tpl.id} className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start justify-between gap-4">
                <span className="text-base">{tpl.name}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl" onClick={() => openEdit(tpl)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-red-600 hover:text-red-700"
                    onClick={() => deleteTemplate.mutate(tpl.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              {tpl.description && <CardDescription>{tpl.description}</CardDescription>}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Taxa real</span>
                <span className="text-foreground/80">{toPercentString(tpl.baseTax).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>IPCA</span>
                <span className="text-foreground/80">{toPercentString(tpl.inflation).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Valorização imóveis</span>
                <span className="text-foreground/80">{toPercentString(tpl.realEstateRate).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>ITCMD + custos</span>
                <span className="text-foreground/80">{toPercentString(tpl.successionTax).toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {sortedTemplates.length === 0 && (
          <Card className="rounded-2xl md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Nenhum template ainda</CardTitle>
              <CardDescription>Crie um template para preencher automaticamente as premissas macro em novas simulações.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle>{editing ? "Editar template" : "Novo template"}</DialogTitle>
            <DialogDescription>Defina as premissas macroeconômicas que serão reaproveitadas.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cenário Brasil Otimista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Premissas para ciclo de queda de juros e inflação ancorada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Real (% a.a.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inflation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IPCA (% a.a.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="realEstateRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valorização de Imóvel (% a.a.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="successionTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ITCMD + Custos (% do patrimônio)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {editing ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

