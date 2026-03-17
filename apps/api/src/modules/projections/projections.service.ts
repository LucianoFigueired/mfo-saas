import { isBefore, isAfter, endOfYear, startOfYear } from 'date-fns';
import { Decimal } from 'decimal.js';
import { Status } from '@mfo/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../prisma/prisma.service';
import { ProjectionGeneratedEvent } from './events/projection-generated.event';

@Injectable()
export class ProjectionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async generate(
    simulationId: string,
    userId: string, // Advisor
    statusOverride?: Status,
  ) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        client: {
          advisorId: userId,
        },
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

    const inflationRate = (simulation as any).inflation
      ? new Decimal((simulation as any).inflation)
      : new Decimal(0.04);
    const financialRate = new Decimal(simulation.baseTax);
    const realEstateRate = (simulation as any).realEstateRate
      ? new Decimal((simulation as any).realEstateRate)
      : new Decimal(0.05);
    const successionTaxRate = (simulation as any).successionTax
      ? new Decimal((simulation as any).successionTax)
      : new Decimal(0.15);

    // 1. Separa o patrimônio inicial por Classe de Ativo
    let { financial, realEstate } = this.calculateInitialWealthByClass(
      simulation.assets,
      simulation.startDate,
    );

    for (let year = startYear; year <= endYear; year++) {
      const yearStart = startOfYear(new Date(year, 0, 1));

      // 2. Calcular Fluxo de Caixa (Entradas - Saídas)
      const yearlyCashFlow = this.calculateYearlyCashFlow(
        simulation.events,
        year,
        status,
      );

      let insurancePayout = new Decimal(0);
      let successionCost = new Decimal(0);

      // 3. Regra de Sucessão: Morte dispara Seguro + Impostos (ITCMD)
      if (status === 'MORTO' && year === startYear) {
        insurancePayout = this.calculateActiveInsurancesPayout(
          simulation.insurances,
          simulation.startDate,
        );

        // O prêmio do seguro entra como liquidez financeira
        financial = financial.plus(insurancePayout);

        // ITCMD incide sobre o patrimônio bruto (Imóveis + Financeiro)
        const grossEstate = financial.plus(realEstate);
        successionCost = grossEstate.times(successionTaxRate);

        // A mordida da sucessão corrói a liquidez da família (dinheiro em conta)
        financial = financial.minus(successionCost);
      }

      // 4. O Fluxo de caixa anual aumenta ou consome o caixa financeiro
      financial = financial.plus(yearlyCashFlow);

      // 5. Total do Patrimônio Nominal (Dinheiro de padeiro)
      const nominalWealth = financial.plus(realEstate);

      // 6. Total do Patrimônio Real (Descontando a Inflação IPCA)
      const yearsPassed = year - startYear;
      const inflationFactor = new Decimal(1)
        .plus(inflationRate)
        .pow(yearsPassed);
      const realWealth = nominalWealth.div(inflationFactor);

      // 7. Salva o snapshot do ano
      results.push({
        year,
        wealth: nominalWealth.toFixed(2), // Nominal (Mantido para não quebrar o frontend atual)
        realWealth: realWealth.toFixed(2), // Real (Novo!)
        financialWealth: financial.toFixed(2),
        realEstateWealth: realEstate.toFixed(2),
        cashFlow: yearlyCashFlow.toFixed(2),
        insuranceReceived: insurancePayout.isZero()
          ? undefined
          : insurancePayout.toFixed(2),
        successionCost: successionCost.isZero()
          ? undefined
          : successionCost.toFixed(2),
      });

      // 8. Aplica Juros Compostos para o ANO SEGUINTE (Cada classe com sua taxa)
      financial = financial.times(new Decimal(1).plus(financialRate));
      realEstate = realEstate.times(new Decimal(1).plus(realEstateRate));
    }

    console.log(results);

    // this.eventEmitter.emit(
    //   'projection.generated',
    //   new ProjectionGeneratedEvent(simulationId, userId, results, {
    //     name: simulation.name,
    //     baseTax: simulation.baseTax.toNumber(),
    //     status: status,
    //   }),
    // );

    return results;
  }

  async createVersion(
    id: string,
    userId: string, // Advisor
    newName?: string,
    isSituationActual = false,
  ) {
    const original = await this.prisma.simulation.findFirst({
      where: {
        id,
        client: { advisorId: userId },
      },
      include: { assets: true, events: true, insurances: true },
    });

    if (!original)
      throw new NotFoundException(
        'Simulação original não encontrada ou acesso negado',
      );

    const name = newName || original.name;
    const startDate = isSituationActual ? new Date() : original.startDate;

    return this.prisma.$transaction(async (tx) => {
      const newVersion = await tx.simulation.create({
        data: {
          name,
          baseTax: original.baseTax,
          startDate,
          status: original.status,
          clientId: original.clientId,
          version: isSituationActual ? 1 : original.version + 1,
          parentVersionId: original.id,
          isLegacy: false,

          // Clonando as novas taxas
          inflation: (original as any).inflation,
          realEstateRate: (original as any).realEstateRate,
          successionTax: (original as any).successionTax,
        },
      });

      if (!isSituationActual) {
        if (original.assets.length > 0) {
          await tx.asset.createMany({
            data: original.assets.map(({ id, simulationId, ...rest }) => ({
              ...rest,
              simulationId: newVersion.id,
            })),
          });
        }
        if (original.events.length > 0) {
          await tx.event.createMany({
            data: original.events.map(({ id, simulationId, ...rest }) => ({
              ...rest,
              simulationId: newVersion.id,
            })),
          });
        }
        if (original.insurances.length > 0) {
          await tx.insurance.createMany({
            data: original.insurances.map(({ id, simulationId, ...rest }) => ({
              ...rest,
              simulationId: newVersion.id,
            })),
          });
        }

        if (!newName) {
          await tx.simulation.update({
            where: { id },
            data: { isLegacy: true },
          });
        }
      }

      return tx.simulation.findUnique({
        where: { id: newVersion.id },
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

      const isActiveThisYear =
        isBefore(eventStart, yearEnd) &&
        (!eventEnd || isAfter(eventEnd, yearStart));

      if (!isActiveThisYear) return;

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

  private calculateActiveInsurancesPayout(
    insurances: any[],
    referenceDate: Date,
  ): Decimal {
    return insurances.reduce((acc, ins) => {
      const startDate = new Date(ins.startDate);
      const expirationDate = new Date(startDate);
      expirationDate.setMonth(expirationDate.getMonth() + ins.duration);

      const isActive =
        isBefore(startDate, referenceDate) &&
        isAfter(expirationDate, referenceDate);

      return isActive ? acc.plus(new Decimal(ins.insuredValue)) : acc;
    }, new Decimal(0));
  }

  private calculateInitialWealthByClass(
    assets: any[],
    startDate: Date,
  ): { financial: Decimal; realEstate: Decimal } {
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

    let financial = new Decimal(0);
    let realEstate = new Decimal(0);

    Array.from(latestAssets.values()).forEach((asset) => {
      if (asset.type === 'IMOBILIZADO') {
        realEstate = realEstate.plus(new Decimal(asset.value));
      } else {
        financial = financial.plus(new Decimal(asset.value));
      }
    });

    return { financial, realEstate };
  }
}
