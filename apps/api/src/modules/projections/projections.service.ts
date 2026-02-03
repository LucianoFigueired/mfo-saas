import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { isBefore, isAfter, endOfYear, startOfYear } from 'date-fns';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectionGeneratedEvent } from './events/projection-generated.event';
import { Status } from '@mfo/database';

@Injectable()
export class ProjectionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async generate(
    simulationId: string,
    userId: string,
    statusOverride?: Status,
  ) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        userId: userId,
      },
      include: {
        assets: true,
        events: true,
        insurances: true,
      },
    });

    if (!simulation)
      throw new NotFoundException('Simulação não encontrada ou acesso negado');

    const status = statusOverride || simulation.status;
    const startYear = simulation.startDate.getFullYear();
    const endYear = 2060;
    const results: any[] = [];

    let currentWealth = this.calculateInitialWealth(
      simulation.assets,
      simulation.startDate,
    );

    for (let year = startYear; year <= endYear; year++) {
      const yearStart = startOfYear(new Date(year, 0, 1));

      // 1. Calcular Fluxo de Caixa considerando validade dos eventos
      const yearlyCashFlow = this.calculateYearlyCashFlow(
        simulation.events,
        year,
        status,
      );

      // 2. Somar Seguros Ativos (apenas se MORTO e no ano da simulação)
      let insurancePayout = new Decimal(0);
      if (status === 'MORTO' && year === startYear) {
        insurancePayout = this.calculateActiveInsurancesPayout(
          simulation.insurances,
          simulation.startDate,
        );
      }

      // 3. Atualizar patrimônio: (Saldo + Fluxo + Seguro)
      currentWealth = currentWealth.plus(yearlyCashFlow).plus(insurancePayout);

      // 4. Aplicar Juros Compostos (Taxa Real)
      const growthFactor = new Decimal(1).plus(simulation.baseTax);
      currentWealth = currentWealth.times(growthFactor);

      results.push({
        year,
        wealth: currentWealth.toFixed(2),
        cashFlow: yearlyCashFlow.toFixed(2),
        insuranceReceived: insurancePayout.isZero()
          ? undefined
          : insurancePayout.toFixed(2),
      });
    }

    this.eventEmitter.emit(
      'projection.generated',
      new ProjectionGeneratedEvent(simulationId, userId, results, {
        name: simulation.name,
        baseTax: simulation.baseTax.toNumber(),
        status: status,
      }),
    );

    return results;
  }

  async createVersion(
    id: string,
    userId: string,
    newName?: string,
    isSituationActual = false,
  ) {
    // Busca a simulação original validando o dono
    const original = await this.prisma.simulation.findFirst({
      where: { id, userId },
      include: { assets: true, events: true, insurances: true },
    });

    if (!original)
      throw new NotFoundException(
        'Simulação original não encontrada ou acesso negado',
      );

    const name = newName || original.name;
    const startDate = isSituationActual ? new Date() : original.startDate;

    return this.prisma.$transaction(async (tx) => {
      if (!isSituationActual && !newName) {
        await tx.simulation.update({
          where: { id },
          data: { isLegacy: true },
        });
      }

      return tx.simulation.create({
        data: {
          name,
          baseTax: original.baseTax,
          startDate,
          status: original.status,
          userId: userId,
          version: isSituationActual ? 1 : original.version + 1,
          parentVersionId: original.id,
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
              ({ id, simulationId, ...rest }) => ({ ...rest }),
            ),
          },
        },
        include: { assets: true, events: true, insurances: true },
      });
    });
  }

  private calculateYearlyCashFlow(
    events: any[],
    year: number,
    status: string,
  ): Decimal {
    let total = new Decimal(0);
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    events.forEach((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : null;

      // Verifica se o evento é válido para este ano
      // Regra: O evento deve ter começado antes do fim deste ano E (não ter fim ou acabar após o início deste ano)
      const isActiveThisYear =
        isBefore(eventStart, yearEnd) &&
        (!eventEnd || isAfter(eventEnd, yearStart));

      if (!isActiveThisYear) return;

      // Regras de Status (MFO)
      if (status === 'MORTO' && event.type === 'ENTRADA') return;

      let eventValue = new Decimal(event.value);
      if (status === 'MORTO' && event.type === 'SAIDA') {
        eventValue = eventValue.div(2);
      }

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

  // Lógica Dinâmica de Seguros
  private calculateActiveInsurancesPayout(
    insurances: any[],
    referenceDate: Date,
  ): Decimal {
    return insurances.reduce((acc, ins) => {
      const startDate = new Date(ins.startDate);
      // Calcula a data de expiração baseada na duração em meses
      const expirationDate = new Date(startDate);
      expirationDate.setMonth(expirationDate.getMonth() + ins.duration);

      // O seguro só paga se estiver ativo na data de referência (morte)
      const isActive =
        isBefore(startDate, referenceDate) &&
        isAfter(expirationDate, referenceDate);

      return isActive ? acc.plus(new Decimal(ins.insuredValue)) : acc;
    }, new Decimal(0));
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
}
