import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { addYears, isBefore, isAfter, startOfYear } from 'date-fns';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectionGeneratedEvent } from './events/projection-generated.event';
import { Status } from '@mfo/database';

@Injectable()
export class ProjectionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async generate(simulationId: string, statusOverride?: Status) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        assets: true,
        events: true,
        insurances: true,
      },
    });

    if (!simulation) throw new NotFoundException('Simulação não encontrada');

    const status = statusOverride || simulation.status;
    const startYear = simulation.startDate.getFullYear();
    const endYear = 2060;
    const results: any[] = [];

    let currentWealth = this.calculateInitialWealth(
      simulation.assets,
      simulation.startDate,
    );

    for (let year = startYear; year <= endYear; year++) {
      const yearlyCashFlow = this.calculateYearlyCashFlow(
        simulation.events,
        year,
        status,
      );

      currentWealth = currentWealth.plus(yearlyCashFlow);
      const growthFactor = new Decimal(1).plus(simulation.baseTax);
      currentWealth = currentWealth.times(growthFactor);

      if (status === 'MORTO' && year === startYear) {
        const totalInsurance = simulation.insurances.reduce(
          (acc, ins) => acc.plus(ins.insuredValue),
          new Decimal(0),
        );
        currentWealth = currentWealth.plus(totalInsurance);
      }

      results.push({
        year,
        wealth: currentWealth.toFixed(2),
        cashFlow: yearlyCashFlow.toFixed(2),
      });
    }

    this.eventEmitter.emit(
      'projection.generated',
      new ProjectionGeneratedEvent(simulationId, results, {
        name: simulation.name,
        baseTax: simulation.baseTax.toNumber(),
        status: status,
      }),
    );

    return results;
  }

  async createVersion(id: string, newName?: string, isSituationActual = false) {
    // 1. Busca a simulação original com todas as relações
    const original = await this.prisma.simulation.findUnique({
      where: { id },
      include: { assets: true, events: true, insurances: true },
    });

    if (!original)
      throw new NotFoundException('Simulação original não encontrada');

    // 2. Define os novos atributos
    const name = newName || original.name;
    const startDate = isSituationActual ? new Date() : original.startDate;

    // 3. Execução Atômica
    return this.prisma.$transaction(async (tx) => {
      // Regra: Se for uma nova versão do mesmo nome (não é Situação Atual), marca a anterior como legado
      if (!isSituationActual && !newName) {
        await tx.simulation.update({
          where: { id },
          data: { isLegacy: true },
        });
      }

      // Cria a nova simulação clonando os dados
      return tx.simulation.create({
        data: {
          name,
          baseTax: original.baseTax,
          startDate,
          status: original.status,
          userId: original.userId,
          version: isSituationActual ? 1 : original.version + 1,
          parentVersionId: original.id,
          // Clonagem profunda das relações
          assets: {
            create: original.assets.map(({ id, simulationId, ...rest }) => ({
              ...rest,
            })),
          },
          events: {
            create: original.events.map(({ id, simulationId, ...rest }) => ({
              ...rest,
            })),
          },
          insurances: {
            create: original.insurances.map(
              ({ id, simulationId, ...rest }) => ({
                ...rest,
              }),
            ),
          },
        },
        include: { assets: true, events: true, insurances: true },
      });
    });
  }

  private calculateInitialWealth(assets: any[], startDate: Date): Decimal {
    // Agrupar ativos por nome e pegar o mais recente que seja <= startDate
    const latestAssets = new Map<string, any>();

    assets.forEach((asset) => {
      if (
        isBefore(asset.date, startDate) ||
        asset.date.getTime() === startDate.getTime()
      ) {
        const existing = latestAssets.get(asset.name);
        if (!existing || isAfter(asset.date, existing.date)) {
          latestAssets.set(asset.name, asset);
        }
      }
    });

    return Array.from(latestAssets.values()).reduce(
      (acc, asset) => acc.plus(new Decimal(asset.value)),
      new Decimal(0),
    );
  }

  private calculateYearlyCashFlow(
    events: any[],
    year: number,
    status: string,
  ): Decimal {
    let total = new Decimal(0);

    events.forEach((event) => {
      // Regra de Status
      if (status === 'MORTO' && event.type === 'ENTRADA') return; // Morto não tem entrada

      let eventValue = new Decimal(event.value);

      // Regra de Status: Despesas divididas por 2 se morto
      if (status === 'MORTO' && event.type === 'SAIDA') {
        eventValue = eventValue.div(2);
      }

      // Cálculo simplificado de frequência
      const multiplier = event.frequency === 'MONTHLY' ? 12 : 1;
      const yearlyImpact = eventValue.times(multiplier);

      if (event.type === 'ENTRADA') {
        total = total.plus(yearlyImpact);
      } else {
        total = total.minus(yearlyImpact);
      }
    });

    return total;
  }
}
