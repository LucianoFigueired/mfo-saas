// apps/api/src/modules/events/events.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from '@mfo/common';
import { Frequency } from '@mfo/database';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(simulationId: string, dto: CreateEventDto) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
    });
    if (!simulation) throw new NotFoundException('Simulação não encontrada');

    return this.prisma.event.create({
      data: {
        ...dto,
        simulationId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        frequency: Frequency[dto.frequency],
      },
    });
  }

  async findAllBySimulation(simulationId: string) {
    return this.prisma.event.findMany({
      where: { simulationId },
      orderBy: { startDate: 'asc' },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    try {
      return await this.prisma.event.update({
        where: { id },
        data: {
          ...dto,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          frequency: dto.frequency ? Frequency[dto.frequency] : undefined,
        },
      });
    } catch (error) {
      throw new NotFoundException('Evento não encontrado');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.event.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException('Evento não encontrado');
    }
  }
}
