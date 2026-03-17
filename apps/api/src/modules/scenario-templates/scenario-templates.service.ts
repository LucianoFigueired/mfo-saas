import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateScenarioTemplateDto,
  UpdateScenarioTemplateDto,
} from '@mfo/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScenarioTemplatesService {
  constructor(private prisma: PrismaService) {}

  findAll(advisorId: string) {
    return this.prisma.scenarioTemplate.findMany({
      where: { advisorId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, advisorId: string) {
    const tpl = await this.prisma.scenarioTemplate.findFirst({
      where: { id, advisorId },
    });
    if (!tpl) {
      throw new NotFoundException('Template não encontrado ou acesso negado');
    }
    return tpl;
  }

  create(dto: CreateScenarioTemplateDto, advisorId: string) {
    return this.prisma.scenarioTemplate.create({
      data: {
        advisorId,
        name: dto.name,
        description: dto.description,
        baseTax: dto.baseTax,
        inflation: dto.inflation,
        realEstateRate: dto.realEstateRate,
        successionTax: dto.successionTax,
      },
    });
  }

  async update(id: string, dto: UpdateScenarioTemplateDto, advisorId: string) {
    await this.findOne(id, advisorId);
    return this.prisma.scenarioTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        baseTax: dto.baseTax,
        inflation: dto.inflation,
        realEstateRate: dto.realEstateRate,
        successionTax: dto.successionTax,
      },
    });
  }

  async remove(id: string, advisorId: string) {
    await this.findOne(id, advisorId);
    return this.prisma.scenarioTemplate.delete({
      where: { id },
    });
  }
}
