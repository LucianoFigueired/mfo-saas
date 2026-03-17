import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateScenarioTemplateSchema,
  UpdateScenarioTemplateSchema,
} from '@mfo/common';
import type {
  CreateScenarioTemplateDto,
  UpdateScenarioTemplateDto,
} from '@mfo/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScenarioTemplatesService } from './scenario-templates.service';

type RequestWithUser = { user: { userId: string } };

@Controller('scenario-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScenarioTemplatesController {
  constructor(
    private readonly scenarioTemplatesService: ScenarioTemplatesService,
  ) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.scenarioTemplatesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.scenarioTemplatesService.findOne(id, req.user.userId);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateScenarioTemplateSchema))
    dto: CreateScenarioTemplateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.scenarioTemplatesService.create(dto, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateScenarioTemplateSchema))
    dto: UpdateScenarioTemplateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.scenarioTemplatesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.scenarioTemplatesService.remove(id, req.user.userId);
  }
}
