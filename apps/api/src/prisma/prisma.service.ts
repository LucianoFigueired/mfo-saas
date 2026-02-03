import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Importamos do nosso pacote interno do monorepo
import { PrismaClient } from '@mfo/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
