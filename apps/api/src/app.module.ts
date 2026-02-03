import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectionsModule } from './modules/projections/projections.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './modules/ai/ai.service';

@Module({
  imports: [
    PrismaModule,
    ProjectionsModule,
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '') || 6379,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AiService],
})
export class AppModule {}
