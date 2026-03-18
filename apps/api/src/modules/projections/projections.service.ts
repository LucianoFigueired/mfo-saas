import { isBefore, isAfter, endOfYear, startOfYear } from 'date-fns';
import { Decimal } from 'decimal.js';
import { Status } from '@mfo/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../prisma/prisma.service';

type AssetRow = {
  name: string;
  type: 'FINANCEIRO' | 'IMOBILIZADO';
  value: { toString(): string };
  date: Date;
  returnRate?: { toString(): string } | null;
};

type EventRow = {
  name: string;
  type: 'ENTRADA' | 'SAIDA';
  value: { toString(): string };
  frequency: 'ONCE' | 'MONTHLY' | 'YEARLY';
  startDate: Date;
  endDate: Date | null;
};

type InsuranceRow = {
  insuredValue: { toString(): string };
  startDate: Date;
  duration: number;
};

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
    const results: Array<Record<string, unknown>> = [];

    const inflationRate = simulation.inflation
      ? new Decimal(simulation.inflation.toString())
      : new Decimal(0.04);
    const financialRate = new Decimal(simulation.baseTax);
    const realEstateRate = simulation.realEstateRate
      ? new Decimal(simulation.realEstateRate.toString())
      : new Decimal(0.05);
    const successionTaxRate = simulation.successionTax
      ? new Decimal(simulation.successionTax.toString())
      : new Decimal(0.15);

    // 1. Separa o patrimônio inicial por Classe e Rentabilidade (financeiro)
    let { financialBuckets, realEstate } = this.calculateInitialWealthByClass(
      simulation.assets as unknown as AssetRow[],
      simulation.startDate,
      financialRate,
    );

    for (let year = startYear; year <= endYear; year++) {
      // 2. Calcular Fluxo de Caixa (Entradas - Saídas)
      const yearlyCashFlow = this.calculateYearlyCashFlow(
        simulation.events as unknown as EventRow[],
        year,
        status,
      );

      let insurancePayout = new Decimal(0);
      let successionCost = new Decimal(0);

      // 3. Regra de Sucessão: Morte dispara Seguro + Impostos (ITCMD)
      if (status === 'MORTO' && year === startYear) {
        insurancePayout = this.calculateActiveInsurancesPayout(
          simulation.insurances as unknown as InsuranceRow[],
          simulation.startDate,
        );

        // O prêmio do seguro entra como liquidez financeira
        financialBuckets = this.addToFinancialBuckets(
          financialBuckets,
          financialRate,
          insurancePayout,
        );

        // ITCMD incide sobre o patrimônio bruto (Imóveis + Financeiro)
        const financialTotal = this.sumFinancialBuckets(financialBuckets);
        const grossEstate = financialTotal.plus(realEstate);
        successionCost = grossEstate.times(successionTaxRate);

        // A mordida da sucessão corrói a liquidez da família (dinheiro em conta)
        financialBuckets = this.addToFinancialBuckets(
          financialBuckets,
          financialRate,
          successionCost.negated(),
        );
      }

      // 4. O Fluxo de caixa anual aumenta ou consome o caixa financeiro
      financialBuckets = this.addToFinancialBuckets(
        financialBuckets,
        financialRate,
        yearlyCashFlow,
      );

      // 5. Total do Patrimônio Nominal (Dinheiro de padeiro)
      const financialTotal = this.sumFinancialBuckets(financialBuckets);
      const nominalWealth = financialTotal.plus(realEstate);

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
        financialWealth: financialTotal.toFixed(2),
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
      financialBuckets = financialBuckets.map((b) => ({
        rate: b.rate,
        value: b.value.times(new Decimal(1).plus(b.rate)),
      }));
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
          inflation: original.inflation,
          realEstateRate: original.realEstateRate,
          successionTax: original.successionTax,
        },
      });

      if (!isSituationActual) {
        if (original.assets.length > 0) {
          await tx.asset.createMany({
            data: original.assets.map((asset) => {
              const { id, simulationId, ...rest } = asset;
              void id;
              void simulationId;
              return {
                ...rest,
                simulationId: newVersion.id,
              };
            }),
          });
        }
        if (original.events.length > 0) {
          await tx.event.createMany({
            data: original.events.map((event) => {
              const { id, simulationId, ...rest } = event;
              void id;
              void simulationId;
              return {
                ...rest,
                simulationId: newVersion.id,
              };
            }),
          });
        }
        if (original.insurances.length > 0) {
          await tx.insurance.createMany({
            data: original.insurances.map((ins) => {
              const { id, simulationId, ...rest } = ins;
              void id;
              void simulationId;
              return {
                ...rest,
                simulationId: newVersion.id,
              };
            }),
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
    events: EventRow[],
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

      let eventValue = new Decimal(event.value.toString());
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
    insurances: InsuranceRow[],
    referenceDate: Date,
  ): Decimal {
    return insurances.reduce((acc, ins) => {
      const startDate = new Date(ins.startDate);
      const expirationDate = new Date(startDate);
      expirationDate.setMonth(expirationDate.getMonth() + ins.duration);

      const isActive =
        isBefore(startDate, referenceDate) &&
        isAfter(expirationDate, referenceDate);

      return isActive
        ? acc.plus(new Decimal(ins.insuredValue.toString()))
        : acc;
    }, new Decimal(0));
  }

  private calculateInitialWealthByClass(
    assets: AssetRow[],
    startDate: Date,
    defaultFinancialRate: Decimal,
  ): {
    financialBuckets: { rate: Decimal; value: Decimal }[];
    realEstate: Decimal;
  } {
    const latestAssets = new Map<string, AssetRow>();

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

    const bucketMap = new Map<string, { rate: Decimal; value: Decimal }>();
    let realEstate = new Decimal(0);

    Array.from(latestAssets.values()).forEach((asset) => {
      if (asset.type === 'IMOBILIZADO') {
        realEstate = realEstate.plus(new Decimal(asset.value.toString()));
      } else {
        const rate = asset.returnRate
          ? new Decimal(asset.returnRate.toString())
          : defaultFinancialRate;
        const key = rate.toString();
        const existing = bucketMap.get(key);
        const value = new Decimal(asset.value.toString());
        bucketMap.set(key, {
          rate,
          value: existing ? existing.value.plus(value) : value,
        });
      }
    });

    return { financialBuckets: Array.from(bucketMap.values()), realEstate };
  }

  private sumFinancialBuckets(
    buckets: { rate: Decimal; value: Decimal }[],
  ): Decimal {
    return buckets.reduce((acc, b) => acc.plus(b.value), new Decimal(0));
  }

  private addToFinancialBuckets(
    buckets: { rate: Decimal; value: Decimal }[],
    defaultRate: Decimal,
    delta: Decimal,
  ) {
    const key = defaultRate.toString();
    const bucketMap = new Map(
      buckets.map((b) => [b.rate.toString(), { rate: b.rate, value: b.value }]),
    );
    const existing = bucketMap.get(key);
    bucketMap.set(key, {
      rate: defaultRate,
      value: existing ? existing.value.plus(delta) : delta,
    });
    return Array.from(bucketMap.values());
  }
}
