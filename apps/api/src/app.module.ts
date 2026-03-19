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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from './modules/clients/clients.module';
import { ScenarioTemplatesModule } from './modules/scenario-templates/scenario-templates.module';
import { ProductsModule } from './modules/products/products.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ProjectionsModule,
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
          tls: {
            rejectUnauthorized: false,
          },
          maxRetriesPerRequest: null,
        },
      }),
    }),
    SimulationsModule,
    AssetsModule,
    EventsModule,
    InsurancesModule,
    UsersModule,
    AuthModule,
    ClientsModule,
    ScenarioTemplatesModule,
    ProductsModule,
    TasksModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, AiService, NotificationsGateway],
})
export class AppModule {}
