"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { Client } from "@/types/client";

const CreateTaskFormSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  clientId: z.string().uuid().optional().or(z.literal("")),
});

function priorityLabel(p: TaskPriority) {
  if (p === "HIGH") return "Alta";
  if (p === "MEDIUM") return "Média";
  return "Baixa";
}

function priorityClass(p: TaskPriority) {
  if (p === "HIGH") return "bg-red-100 text-red-700";
  if (p === "MEDIUM") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(s: TaskStatus) {
  if (s === "TODO") return "A Fazer";
  if (s === "IN_PROGRESS") return "Em Andamento";
  return "Concluído";
}

function formatDatePt(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("pt-BR");
}

function startOfTodayIsoDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function CalendarTasksPage() {
  const [bucket, setBucket] = useState<"overdue" | "today" | "week" | "all">("overdue");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks({ bucket });
  const { clients } = useClients();

  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof CreateTaskFormSchema>>({
    resolver: zodResolver(CreateTaskFormSchema) as unknown as Resolver<z.infer<typeof CreateTaskFormSchema>>,
    defaultValues: {
      title: "",
      description: "",
      dueDate: startOfTodayIsoDate(),
      priority: "MEDIUM",
      clientId: "",
    },
  });

  const grouped = useMemo(() => {
    const t = tasks || [];
    const byStatus: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    t.forEach((task) => byStatus[task.status].push(task));
    return byStatus;
  }, [tasks]);

  async function onSubmit(data: z.infer<typeof CreateTaskFormSchema>) {
    await createTask.mutateAsync({
      title: data.title,
      description: data.description || undefined,
      dueDate: new Date(`${data.dueDate}T09:00:00.000Z`).toISOString(),
      priority: data.priority,
      clientId: data.clientId ? data.clientId : undefined,
      status: "TODO",
    });
    setOpen(false);
    form.reset({
      title: "",
      description: "",
      dueDate: startOfTodayIsoDate(),
      priority: "MEDIUM",
      clientId: "",
    });
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-start justify-between gap-3">
          <span className="text-foreground/90">{task.title}</span>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${priorityClass(task.priority)}`}>{priorityLabel(task.priority)}</span>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">
          <span className="font-medium text-foreground/70">Vence:</span> {formatDatePt(task.dueDate)}
          {task.client?.id && (
            <>
              {" "}
              •{" "}
              <Link href={`/clients/${task.client.id}`} className="underline underline-offset-4">
                {task.client.name}
              </Link>
            </>
          )}
        </CardDescription>
      </CardHeader>
      {task.description && <CardContent className="text-sm text-muted-foreground">{task.description}</CardContent>}
      <CardContent className="pt-0 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{task.source === "AUTO" ? "Automático" : "Manual"} • {statusLabel(task.status)}</div>
        <div className="flex gap-2">
          {task.status !== "DONE" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => updateTask.mutate({ id: task.id, patch: { status: "DONE" } })}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Concluir
            </Button>
          )}
          {task.status === "TODO" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => updateTask.mutate({ id: task.id, patch: { status: "IN_PROGRESS" } })}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Iniciar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-foreground/50 hover:text-red-600"
            onClick={() => deleteTask.mutate(task.id)}
            aria-label="Remover tarefa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground/80">Agenda e Tarefas</h1>
          <p className="text-sm text-muted-foreground">CRM básico com tarefas vinculadas aos clientes (manuais e automáticas).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setView(view === "kanban" ? "list" : "kanban")}>
            {view === "kanban" ? "Ver Lista" : "Ver Kanban"}
          </Button>
          <Button className="rounded-xl" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <Tabs value={bucket} onValueChange={(v) => setBucket(v as typeof bucket)}>
        <TabsList>
          <TabsTrigger value="overdue">Atrasados</TabsTrigger>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Próxima Semana</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <Separator className="my-4" />

        <TabsContent value={bucket} className="mt-0">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando tarefas...</div>
          ) : (tasks || []).length === 0 ? (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Sem tarefas aqui</CardTitle>
                <CardDescription>Crie uma tarefa manual ou aguarde o sistema gerar lembretes automáticos.</CardDescription>
              </CardHeader>
            </Card>
          ) : view === "list" ? (
            <div className="grid grid-cols-1 gap-3">
              {(tasks || []).map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground/80">A Fazer</div>
                {grouped.TODO.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground/80">Em Andamento</div>
                {grouped.IN_PROGRESS.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground/80">Concluído</div>
                {grouped.DONE.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>Crie um lembrete manual e vincule a um cliente para acesso rápido.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex: "Ligar para revisar carteira devido à queda da Selic"' {...field} />
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
                      <Textarea placeholder="Contexto, links, próximos passos..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-11 rounded-xl">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Baixa</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="min-h-11 rounded-xl">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(clients || []).map((c: Client) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTask.isPending}>
                  Criar tarefa
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

