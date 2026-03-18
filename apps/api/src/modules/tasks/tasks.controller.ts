import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from 'nestjs-zod';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TasksService } from './tasks.service';

type RequestWithUser = { user: { userId: string } };

const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
const TaskSourceSchema = z.enum(['MANUAL', 'AUTO']);
const TaskKindSchema = z.enum([
  'GENERAL',
  'INSURANCE_EXPIRY',
  'BIRTHDAY',
  'AI_RISK',
  'SIMULATION_FOLLOWUP',
]);

const CreateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  dueDate: z.string().datetime().or(z.date()),
  priority: TaskPrioritySchema.optional(),
  status: TaskStatusSchema.optional(),
  clientId: z.string().uuid().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  source: TaskSourceSchema.optional(),
  kind: TaskKindSchema.optional(),
});

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('bucket') bucket?: 'overdue' | 'today' | 'week' | 'all',
    @Query('status') status?: 'TODO' | 'IN_PROGRESS' | 'DONE',
  ) {
    return this.tasksService.findAll(req.user.userId, { bucket, status });
  }

  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateTaskSchema))
    dto: z.infer<typeof CreateTaskSchema>,
  ) {
    return this.tasksService.createManual(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema))
    dto: z.infer<typeof UpdateTaskSchema>,
  ) {
    return this.tasksService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.tasksService.remove(req.user.userId, id);
  }
}
