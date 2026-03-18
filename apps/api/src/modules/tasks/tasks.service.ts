import { Injectable, NotFoundException } from '@nestjs/common';
import { addDays, addMonths, isBefore, startOfDay } from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

type Bucket = 'overdue' | 'today' | 'week' | 'all';
type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate: string | Date;
  priority?: Priority;
  status?: Status;
  clientId?: string;
};

type UpdateTaskInput = Partial<CreateTaskInput> & {
  source?: 'MANUAL' | 'AUTO';
  kind?:
    | 'GENERAL'
    | 'INSURANCE_EXPIRY'
    | 'BIRTHDAY'
    | 'AI_RISK'
    | 'SIMULATION_FOLLOWUP';
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    advisorId: string,
    filters?: { bucket?: Bucket; status?: Status },
  ) {
    await this.ensureAutoTasks(advisorId);

    const bucket = filters?.bucket || 'all';
    const status = filters?.status;

    const todayStart = startOfDay(new Date());
    const tomorrowStart = addDays(todayStart, 1);
    const weekEnd = addDays(todayStart, 7);

    const dueDateWhere =
      bucket === 'overdue'
        ? { lt: todayStart }
        : bucket === 'today'
          ? { gte: todayStart, lt: tomorrowStart }
          : bucket === 'week'
            ? { gte: todayStart, lt: addDays(weekEnd, 1) }
            : undefined;

    return this.prisma.task.findMany({
      where: {
        advisorId,
        ...(status ? { status } : {}),
        ...(dueDateWhere ? { dueDate: dueDateWhere } : {}),
      },
      include: { client: true },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  createManual(advisorId: string, dto: CreateTaskInput) {
    return this.prisma.task.create({
      data: {
        advisorId,
        clientId: dto.clientId,
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'TODO',
        source: 'MANUAL',
        kind: 'GENERAL',
      },
      include: { client: true },
    });
  }

  async update(advisorId: string, id: string, dto: UpdateTaskInput) {
    const task = await this.prisma.task.findFirst({ where: { id, advisorId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        status: dto.status,
        clientId: dto.clientId,
        source: dto.source,
        kind: dto.kind,
      },
      include: { client: true },
    });
  }

  async remove(advisorId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, advisorId } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return this.prisma.task.delete({ where: { id } });
  }

  private async ensureAutoTasks(advisorId: string) {
    await Promise.all([
      this.ensureInsuranceExpiryTasks(advisorId),
      this.ensureBirthdayTasks(advisorId),
      this.ensureSimulationFollowupTasks(advisorId),
      this.ensureAiRiskTasks(advisorId),
    ]);
  }

  private async ensureInsuranceExpiryTasks(advisorId: string) {
    const insurances = await this.prisma.insurance.findMany({
      where: { simulation: { client: { advisorId } } },
      include: { simulation: { include: { client: true } } },
    });

    const now = new Date();

    await Promise.all(
      insurances.map(async (ins) => {
        const expiry = addMonths(new Date(ins.startDate), ins.duration);
        // Lembrete 30 dias antes do vencimento
        const dueDate = addDays(expiry, -30);

        // Não cria lembretes para seguros já vencidos há muito tempo
        if (isBefore(expiry, addMonths(now, -3))) return;

        const clientId = ins.simulation.clientId ?? undefined;
        const clientName = ins.simulation.client?.name ?? 'Cliente';
        const uniqueKey = `AUTO:INSURANCE:${ins.id}:${dueDate.toISOString().slice(0, 10)}`;

        await this.createAutoIfMissing({
          advisorId,
          clientId,
          uniqueKey,
          kind: 'INSURANCE_EXPIRY',
          title: `Seguro vence em breve (${clientName})`,
          description: `O seguro "${ins.name}" vence em ${expiry.toLocaleDateString('pt-BR')}.`,
          dueDate,
          priority: 'MEDIUM',
          metadata: {
            insuranceId: ins.id,
            simulationId: ins.simulationId,
            expiry: expiry.toISOString(),
          },
        });
      }),
    );
  }

  private async ensureBirthdayTasks(advisorId: string) {
    const clients = await this.prisma.client.findMany({
      where: { advisorId },
      select: { id: true, name: true, birthDate: true },
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    await Promise.all(
      clients.map(async (c) => {
        const birth = new Date(c.birthDate);
        const thisYearBirthday = new Date(
          currentYear,
          birth.getMonth(),
          birth.getDate(),
          9,
          0,
          0,
        );
        const nextBirthday = isBefore(thisYearBirthday, now)
          ? new Date(
              currentYear + 1,
              birth.getMonth(),
              birth.getDate(),
              9,
              0,
              0,
            )
          : thisYearBirthday;

        // Só cria dentro de uma janela razoável (próximos 120 dias)
        if (isBefore(addDays(now, 120), nextBirthday)) return;

        const yearKey = nextBirthday.getFullYear();
        const uniqueKey = `AUTO:BIRTHDAY:${c.id}:${yearKey}`;

        await this.createAutoIfMissing({
          advisorId,
          clientId: c.id,
          uniqueKey,
          kind: 'BIRTHDAY',
          title: `Aniversário: ${c.name}`,
          description: `Lembrar de parabenizar ${c.name}.`,
          dueDate: nextBirthday,
          priority: 'LOW',
          metadata: {
            clientId: c.id,
            birthday: nextBirthday.toISOString(),
          },
        });
      }),
    );
  }

  private async ensureSimulationFollowupTasks(advisorId: string) {
    const sims = await this.prisma.simulation.findMany({
      where: {
        client: { advisorId },
        isLegacy: false,
      },
      include: { client: true },
      orderBy: { updatedAt: 'desc' },
    });

    const now = new Date();
    const staleCutoff = addMonths(now, -6);

    await Promise.all(
      sims.map(async (sim) => {
        if (!isBefore(sim.updatedAt, staleCutoff)) return;
        const clientId = sim.clientId ?? undefined;
        const clientName = sim.client?.name ?? 'Cliente';
        const dueDate = startOfDay(now);
        const uniqueKey = `AUTO:SIM_FOLLOWUP:${sim.id}:${dueDate.toISOString().slice(0, 10)}`;

        await this.createAutoIfMissing({
          advisorId,
          clientId,
          uniqueKey,
          kind: 'SIMULATION_FOLLOWUP',
          title: `Cenário desatualizado (${clientName})`,
          description:
            'Solicitar novos extratos. Simulação sem alterações há mais de 6 meses.',
          dueDate,
          priority: 'LOW',
          metadata: {
            simulationId: sim.id,
            lastUpdate: sim.updatedAt.toISOString(),
          },
        });
      }),
    );
  }

  private async ensureAiRiskTasks(advisorId: string) {
    const analyses = await this.prisma.aiAnalysis.findMany({
      where: {
        simulation: { client: { advisorId } },
      },
      include: { simulation: { include: { client: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = new Date();
    const dueDate = startOfDay(now);

    await Promise.all(
      analyses.map(async (a) => {
        const risks = a.risks as unknown;
        const hasRisks = Array.isArray(risks)
          ? risks.length > 0
          : Boolean(risks);
        if (!hasRisks) return;

        const clientId = a.simulation.clientId ?? undefined;
        const clientName = a.simulation.client?.name ?? 'Cliente';
        const uniqueKey = `AUTO:AI_RISK:${a.id}:${dueDate.toISOString().slice(0, 10)}`;

        await this.createAutoIfMissing({
          advisorId,
          clientId,
          uniqueKey,
          kind: 'AI_RISK',
          title: `Alertas de risco (IA) (${clientName})`,
          description: 'Revisar alertas e sugestões gerados pela IA.',
          dueDate,
          priority: 'HIGH',
          metadata: {
            analysisId: a.id,
            simulationId: a.simulationId,
          },
        });
      }),
    );
  }

  private async createAutoIfMissing(input: {
    advisorId: string;
    clientId?: string;
    uniqueKey: string;
    kind:
      | 'GENERAL'
      | 'INSURANCE_EXPIRY'
      | 'BIRTHDAY'
      | 'AI_RISK'
      | 'SIMULATION_FOLLOWUP';
    title: string;
    description?: string;
    dueDate: Date;
    priority: Priority;
    metadata?: Record<string, unknown>;
  }) {
    if (!input.uniqueKey) return;

    const existing = await this.prisma.task.findFirst({
      where: { advisorId: input.advisorId, uniqueKey: input.uniqueKey },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.task.create({
      data: {
        advisorId: input.advisorId,
        clientId: input.clientId,
        uniqueKey: input.uniqueKey,
        source: 'AUTO',
        kind: input.kind,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        priority: input.priority,
        status: 'TODO',
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
  }
}
