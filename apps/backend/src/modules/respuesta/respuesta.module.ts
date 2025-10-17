import { Module } from '@nestjs/common';
import { RespuestaController } from './respuesta.controller';
import { RespuestaService } from './respuesta.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RespuestaController],
  providers: [RespuestaService, PrismaService],
  exports: [RespuestaService],
})
export class RespuestaModule {}
