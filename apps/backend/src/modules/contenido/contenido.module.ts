import { Module } from '@nestjs/common';
import { ContenidoController } from './contenido.controller';
import { ContenidoService } from './contenido.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContenidoController],
  providers: [ContenidoService, PrismaService],
  exports: [ContenidoService],
})
export class ContenidoModule {}
