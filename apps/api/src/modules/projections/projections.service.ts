import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { addYears, isBefore, isAfter, startOfYear } from 'date-fns';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProjectionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async generate(simulationId: string, statusOverride?: 'VIVO' | 'MORTO') {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        assets: true,
        events: true,
        insurances: true,
      },
    });

    if (!simulation) throw new Error('Simulação não encontrada');

    const status = statusOverride || simulation.status;
    const startYear = simulation.startDate.getFullYear();
    const endYear = 2060;
    const results: any[] = [];

    let currentWealth = this.calculateInitialWealth(
      simulation.assets,
      simulation.startDate,
    );

    for (let year = startYear; year <= endYear; year++) {
      const yearDate = new Date(year, 0, 1);

      // Aplicar Entradas e Saídas (Events)
      const yearlyCashFlow = this.calculateYearlyCashFlow(
        simulation.events,
        year,
        status,
      );

      // Atualizar patrimônio com fluxo de caixa
      currentWealth = currentWealth.plus(yearlyCashFlow);

      // Aplicar Juros Compostos (Taxa Real)
      // Patrimônio Final = Patrimônio * (1 + Taxa)
      const growthFactor = new Decimal(1).plus(simulation.baseTax);
      currentWealth = currentWealth.times(growthFactor);

      // Se for o cenário "MORTO", somar o valor segurado no primeiro ano da morte (simplificação)
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

    this.eventEmitter.emit('projection.generated', {
      simulationId,
      results,
      metadata: {
        name: simulation.name,
        baseTax: simulation.baseTax.toNumber(),
        status: status,
      },
    });
    return results;
  }

  async createVersion(id: string, newName?: string, isSituationActual = false) {
    // 1. Busca a simulação original com tudo dentro
    const original = await this.prisma.simulation.findUnique({
      where: { id },
      include: { assets: true, events: true, insurances: true },
    });

    if (!original) throw new Error('Simulação original não encontrada');

    // 2. Define os novos atributos baseados na regra do PS
    const name = newName || original.name;
    const startDate = isSituationActual ? new Date() : original.startDate;

    // Regra: Versão legado é marcada na original se for uma nova versão do mesmo nome
    if (!isSituationActual && !newName) {
      await this.prisma.simulation.update({
        where: { id },
        data: { isLegacy: true },
      });
    }

    // 3. Persistência Atômica (Transação)
    return this.prisma.$transaction(async (tx) => {
      return tx.simulation.create({
        data: {
          name,
          baseTax: original.baseTax,
          startDate,
          status: original.status,
          userId: original.userId,
          version: isSituationActual ? 1 : original.version + 1,
          parentVersionId: original.id,
          // Clonando os Arrays de relação
          assets: {
            create: original.assets.map((a) => ({
              name: a.name,
              type: a.type,
              value: a.value,
              date: a.date,
            })),
          },
          events: {
            create: original.events.map((e) => ({
              name: e.name,
              type: e.type,
              value: e.value,
              frequency: e.frequency,
              startDate: e.startDate,
            })),
          },
          insurances: {
            create: original.insurances.map((i) => ({
              name: i.name,
              premium: i.premium,
              insuredValue: i.insuredValue,
              duration: i.duration,
              startDate: i.startDate,
            })),
          },
        },
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
