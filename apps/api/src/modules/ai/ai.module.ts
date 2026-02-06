import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiService } from './ai.service';

@Module({
  imports: [PrismaModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
