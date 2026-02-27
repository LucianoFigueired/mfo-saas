import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateClientSchema, type CreateClientDto } from '@mfo/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateClientSchema)) body: CreateClientDto,
    @Req() req: any,
  ) {
    return this.clientsService.create(req.user.userId, body);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.clientsService.findAllByAdvisor(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user.userId);
  }
}
