// apps/api/src/modules/events/events.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  UsePipes,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateEventSchema, UpdateEventSchema } from '@mfo/common';

import type { CreateEventDto, UpdateEventDto } from '@mfo/common';

@Controller('simulations/:simulationId/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateEventSchema))
  create(
    @Param('simulationId') simulationId: string,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.create(simulationId, createEventDto);
  }

  @Get()
  findAll(@Param('simulationId') simulationId: string) {
    return this.eventsService.findAllBySimulation(simulationId);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateEventSchema))
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
