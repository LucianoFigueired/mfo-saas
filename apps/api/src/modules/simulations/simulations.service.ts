// apps/api/src/modules/simulations/simulations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSimulationDto, UpdateSimulationDto } from '@mfo/common';

@Injectable()
export class SimulationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSimulationDto, userId: string) {
    return this.prisma.simulation.create({
      data: {
        ...dto,
        userId,
        startDate: new Date(dto.startDate),
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.simulation.findMany({
      where: {
        userId,
        isLegacy: false,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const sim = await this.prisma.simulation.findFirst({
      where: { id, userId },
      include: {
        assets: true,
        events: true,
        insurances: true,
        aiAnalyses: true,
      },
    });

    if (!sim)
      throw new NotFoundException('Simulação não encontrada ou acesso negado');
    return sim;
  }

  async update(id: string, dto: UpdateSimulationDto, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.simulation.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.simulation.delete({
      where: { id },
    });
  }
}
