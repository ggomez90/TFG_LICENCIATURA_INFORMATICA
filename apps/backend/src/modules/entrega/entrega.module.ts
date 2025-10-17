import { Module } from '@nestjs/common';
import { EntregaController } from './entrega.controller';
import { EntregaService } from './entrega.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EntregaController],
  providers: [EntregaService, PrismaService],
  exports: [EntregaService],
})
export class EntregaModule {}
