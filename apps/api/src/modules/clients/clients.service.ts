import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from '@mfo/common';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(advisorId: string, data: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : new Date(),
        advisorId,
      },
    });
  }

  async findAllByAdvisor(advisorId: string) {
    return this.prisma.client.findMany({
      where: { advisorId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { simulations: true },
        },
      },
    });
  }

  async findOne(id: string, advisorId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, advisorId },
      include: {
        simulations: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado ou acesso negado');
    }

    return client;
  }
}
