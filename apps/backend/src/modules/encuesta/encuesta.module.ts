import { Module } from '@nestjs/common';
import { EncuestaController } from './encuesta.controller';
import { EncuestaService } from './encuesta.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EncuestaController],
  providers: [EncuestaService, PrismaService],
  exports: [EncuestaService],
})
export class EncuestaModule {}
