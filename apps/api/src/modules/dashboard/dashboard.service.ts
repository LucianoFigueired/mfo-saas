import { Injectable } from '@nestjs/common';
import {
  endOfMonth,
  startOfMonth,
  subMonths,
  addDays,
  startOfDay,
} from 'date-fns';

import { PrismaService } from '../../prisma/prisma.service';

type AllocationPoint = { name: 'FINANCEIRO' | 'IMOBILIZADO'; value: number };
type AumPoint = { month: string; aum: number };

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'MANUAL' | 'AUTO';
  kind:
    | 'GENERAL'
    | 'INSURANCE_EXPIRY'
    | 'BIRTHDAY'
    | 'AI_RISK'
    | 'SIMULATION_FOLLOWUP';
  clientId: string | null;
  client: { id: string; name: string } | null;
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(advisorId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);

    const [familiesCount, scenariosCount, scenariosThisMonth] =
      await Promise.all([
        this.prisma.client.count({ where: { advisorId } }),
        this.prisma.simulation.count({
          where: { client: { advisorId }, isLegacy: false },
        }),
        this.prisma.simulation.count({
          where: {
            client: { advisorId },
            isLegacy: false,
            createdAt: { gte: monthStart },
          },
        }),
      ]);

    const assets = await this.prisma.asset.findMany({
      where: {
        simulation: {
          client: { advisorId },
          isLegacy: false,
        },
      },
      select: {
        simulationId: true,
        name: true,
        type: true,
        value: true,
        date: true,
      },
      orderBy: [{ simulationId: 'asc' }, { name: 'asc' }, { date: 'desc' }],
    });

    const aumNow = this.computeAumAt(assets, now);
    const aumLastMonthEnd = this.computeAumAt(
      assets,
      endOfMonth(subMonths(now, 1)),
    );
    const monthlyGrowth = aumNow - aumLastMonthEnd;

    const allocation = this.computeAllocationAt(assets, now);
    const aumSeries = this.computeAumSeries(assets, 6);

    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const next7Days = addDays(todayStart, 7);

    const [criticalAlerts, todayTasks] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          advisorId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lte: next7Days },
          OR: [{ priority: 'HIGH' }, { kind: { not: 'GENERAL' } }],
        },
        include: { client: { select: { id: true, name: true } } },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: 8,
      }),
      this.prisma.task.findMany({
        where: {
          advisorId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { gte: todayStart, lt: tomorrowStart },
        },
        include: { client: { select: { id: true, name: true } } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 8,
      }),
    ]);

    const [recentClients, recentSimulations] = await Promise.all([
      this.prisma.client.findMany({
        where: { advisorId },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.simulation.findMany({
        where: { client: { advisorId }, isLegacy: false },
        select: {
          id: true,
          name: true,
          updatedAt: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      kpis: {
        aum: aumNow,
        families: familiesCount,
        scenarios: scenariosCount,
        scenariosThisMonth,
        monthlyGrowth,
      },
      charts: {
        aumSeries,
        allocation,
      },
      alerts: {
        critical: criticalAlerts as unknown as TaskRow[],
        today: todayTasks as unknown as TaskRow[],
      },
      recent: {
        clients: recentClients,
        simulations: recentSimulations,
      },
    };
  }

  private computeAumAt(
    assets: Array<{
      simulationId: string;
      name: string;
      type: 'FINANCEIRO' | 'IMOBILIZADO';
      value: { toString(): string };
      date: Date;
    }>,
    at: Date,
  ) {
    const latestByKey = new Map<string, number>();

    // Assets já vêm ordenados por date desc dentro do (simulationId,name)
    for (const a of assets) {
      if (a.date > at) continue;
      const key = `${a.simulationId}:${a.name}`;
      if (latestByKey.has(key)) continue;
      latestByKey.set(key, Number(a.value.toString()));
    }

    let total = 0;
    for (const v of latestByKey.values()) total += v;
    return total;
  }

  private computeAllocationAt(
    assets: Array<{
      simulationId: string;
      name: string;
      type: 'FINANCEIRO' | 'IMOBILIZADO';
      value: { toString(): string };
      date: Date;
    }>,
    at: Date,
  ): AllocationPoint[] {
    const latestByKey = new Map<
      string,
      { type: 'FINANCEIRO' | 'IMOBILIZADO'; value: number }
    >();

    for (const a of assets) {
      if (a.date > at) continue;
      const key = `${a.simulationId}:${a.name}`;
      if (latestByKey.has(key)) continue;
      latestByKey.set(key, { type: a.type, value: Number(a.value.toString()) });
    }

    let fin = 0;
    let real = 0;
    for (const v of latestByKey.values()) {
      if (v.type === 'IMOBILIZADO') real += v.value;
      else fin += v.value;
    }

    return [
      { name: 'FINANCEIRO', value: fin },
      { name: 'IMOBILIZADO', value: real },
    ];
  }

  private computeAumSeries(
    assets: Array<{
      simulationId: string;
      name: string;
      type: 'FINANCEIRO' | 'IMOBILIZADO';
      value: { toString(): string };
      date: Date;
    }>,
    months: number,
  ): AumPoint[] {
    const points: AumPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = endOfMonth(subMonths(now, i));
      const monthLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
      points.push({ month: monthLabel, aum: this.computeAumAt(assets, d) });
    }
    return points;
  }
}
