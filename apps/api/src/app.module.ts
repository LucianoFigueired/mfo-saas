import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectionsModule } from './modules/projections/projections.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './modules/ai/ai.service';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { AssetsModule } from './modules/assets/assets.module';
import { EventsModule } from './modules/events/events.module';
import { InsurancesModule } from './modules/insurances/insurances.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsGateway } from './modules/notifications/notifications.gateway';

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
    SimulationsModule,
    AssetsModule,
    EventsModule,
    InsurancesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AiService, NotificationsGateway],
})
export class AppModule {}
