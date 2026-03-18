import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProductDto, UpdateProductDto } from '@mfo/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(advisorId: string, q?: string) {
    const query = q?.trim();
    return this.prisma.product.findMany({
      where: {
        advisorId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { provider: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string, advisorId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, advisorId },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado ou acesso negado');
    }
    return product;
  }

  create(dto: CreateProductDto, advisorId: string) {
    return this.prisma.product.create({
      data: {
        advisorId,
        name: dto.name,
        provider: dto.provider,
        category: dto.category,
        description: dto.description,
        returnRate: dto.returnRate,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto, advisorId: string) {
    await this.findOne(id, advisorId);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        provider: dto.provider,
        category: dto.category,
        description: dto.description,
        returnRate: dto.returnRate,
      },
    });
  }

  async remove(id: string, advisorId: string) {
    await this.findOne(id, advisorId);
    return this.prisma.product.delete({ where: { id } });
  }
}
