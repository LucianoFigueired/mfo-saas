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

  async findAll() {
    return this.prisma.simulation.findMany({
      where: { isLegacy: false }, // Retorna apenas as versões atuais por padrão
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sim = await this.prisma.simulation.findUnique({
      where: { id },
      include: {
        assets: true,
        events: true,
        insurances: true,
        aiAnalyses: true,
      },
    });
    if (!sim) throw new NotFoundException('Simulação não encontrada');
    return sim;
  }

  async update(id: string, dto: UpdateSimulationDto) {
    return this.prisma.simulation.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.simulation.delete({ where: { id } });
  }
}
