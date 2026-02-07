import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInsuranceDto, UpdateInsuranceDto } from '@mfo/common';

@Injectable()
export class InsurancesService {
  constructor(private prisma: PrismaService) {}

  async create(simulationId: string, dto: CreateInsuranceDto) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
    });
    if (!simulation) throw new NotFoundException('Simulação não encontrada');

    return this.prisma.insurance.create({
      data: {
        ...dto,
        simulationId,
        startDate: new Date(dto.startDate),
      },
    });
  }

  async findAllBySimulation(simulationId: string) {
    return this.prisma.insurance.findMany({
      where: { simulationId },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(id: string, dto: UpdateInsuranceDto) {
    try {
      return await this.prisma.insurance.update({
        where: { id },
        data: {
          ...dto,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        },
      });
    } catch (error) {
      throw new NotFoundException('Seguro não encontrado');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.insurance.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException('Seguro não encontrado');
    }
  }
}
