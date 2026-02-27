import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSimulationDto, UpdateSimulationDto } from '@mfo/common';

@Injectable()
export class SimulationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSimulationDto, advisorId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, advisorId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado ou acesso negado');
    }

    return this.prisma.simulation.create({
      data: {
        name: dto.name,
        baseTax: dto.baseTax,
        status: dto.status,
        clientId: dto.clientId,
        startDate: new Date(dto.startDate),
      },
    });
  }

  async getLatestAnalysis(simulationId: string, advisorId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id: simulationId,
        client: { advisorId },
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulação não encontrada');
    }

    return this.prisma.aiAnalysis.findFirst({
      where: { simulationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(advisorId: string, clientId?: string) {
    return this.prisma.simulation.findMany({
      where: {
        client: { advisorId },
        ...(clientId ? { clientId } : {}),
        isLegacy: false,
      },
      include: {
        client: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, advisorId: string) {
    const sim = await this.prisma.simulation.findFirst({
      where: {
        id,
        client: { advisorId },
      },
      include: {
        client: true,
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

  async update(id: string, dto: UpdateSimulationDto, advisorId: string) {
    await this.findOne(id, advisorId);

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, advisorId },
      });
      if (!client) throw new NotFoundException('Novo cliente não encontrado');
    }

    return this.prisma.simulation.update({
      where: { id },
      data: {
        name: dto.name,
        baseTax: dto.baseTax,
        status: dto.status,
        clientId: dto.clientId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  async remove(id: string, advisorId: string) {
    await this.findOne(id, advisorId);

    return this.prisma.simulation.delete({
      where: { id },
    });
  }
}
