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
import { CreateProductDto, CreateProductSchema } from "@mfo-common";
import { type Resolver, useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Info } from "lucide-react";

import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import { Badge } from "@/components/@repo/@mfo/common/components/ui/badge";

function toPercent(decimalLike: string | number | null | undefined): number {
  const n = Number(decimalLike);
  if (Number.isNaN(n)) return 0;
  return n * 100;
}

export default function ProductLibraryPage() {
  const [q, setQ] = useState("");
  const { products, createProduct, deleteProduct } = useProducts(undefined, q);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const { updateProduct } = useProducts(editing?.id, q);

  const form = useForm<CreateProductDto>({
    resolver: zodResolver(CreateProductSchema) as unknown as Resolver<CreateProductDto>,
    defaultValues: {
      name: "",
      provider: "",
      category: "",
      description: "",
      returnRate: 12,
    },
  });

  const sorted = useMemo(() => {
    return (products || []).slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [products]);

  function openCreate() {
    setEditing(null);
    form.reset({
      name: "",
      provider: "",
      category: "",
      description: "",
      returnRate: 12,
    });
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    form.reset({
      name: p.name,
      provider: p.provider || "",
      category: p.category || "",
      description: p.description || "",
      returnRate: toPercent(p.returnRate),
    });
    setOpen(true);
  }

  async function onSubmit(data: CreateProductDto) {
    const payload = {
      ...data,
      returnRate: Number(data.returnRate) / 100,
    };
    if (editing) {
      await updateProduct.mutateAsync(payload);
    } else {
      await createProduct.mutateAsync(payload);
    }
    setOpen(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/80">Biblioteca de Ativos / Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre produtos recomendados para reutilizar a rentabilidade ao montar carteiras
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
          <span className="font-semibold">Novo Produto</span>
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white"
            placeholder="Buscar por nome, gestora, categoria..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((p) => (
          <Card key={p.id} className="rounded-2xl gap-4">
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-base">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{[p.provider, p.category].filter(Boolean).join(" • ")}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="xs" className="rounded-xl" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-600/10 hover:border-red-600/10"
                    onClick={() => deleteProduct.mutate(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </Button>
                </div>
              </CardTitle>
              {p.description && (
                <CardDescription className="flex items-center mt-1">
                  <Info className="h-4 w-4" />
                  <span className="ml-2">{p.description}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="text-sm flex justify-between items-end flex-1 text-muted-foreground">
              <span>Rentabilidade esperada</span>
              <span className="text-foreground/80 font-bold">{toPercent(p.returnRate).toFixed(2)}% a.a.</span>
            </CardContent>
          </Card>
        ))}

        {sorted.length === 0 && (
          <Card className="rounded-2xl md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Nenhum produto cadastrado</CardTitle>
              <CardDescription>
                Crie produtos para acelerar o cadastro de ativos nas simulações (puxando a rentabilidade automaticamente).
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>Defina a rentabilidade anual esperada para preencher automaticamente novos ativos</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormLabel>Nome do produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Fundo XPTO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="returnRate"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Rentabilidade (% a.a.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gestora/Corretora <Badge variant="secondary">Opcional</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: XP, BTG, Itaú..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Categoria <Badge variant="secondary">Opcional</Badge>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Multimercado, Renda Fixa..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Descrição <Badge variant="secondary">Opcional</Badge>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Fundo recomendado para caixa e liquidez diária" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
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
