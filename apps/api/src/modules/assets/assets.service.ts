import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto } from '@mfo/common';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(simulationId: string, dto: CreateAssetDto) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
    });
    if (!simulation) throw new NotFoundException('Simulação não encontrada');

    return this.prisma.asset.create({
      data: {
        ...dto,
        simulationId,
        date: new Date(dto.date),
      },
    });
  }

  async findAllBySimulation(simulationId: string) {
    return this.prisma.asset.findMany({
      where: { simulationId },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    try {
      return await this.prisma.asset.update({
        where: { id },
        data: {
          ...dto,
          date: dto.date ? new Date(dto.date) : undefined,
        },
      });
    } catch (error) {
      throw new NotFoundException('Ativo não encontrado');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.asset.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException('Ativo não encontrado');
    }
  }
}
