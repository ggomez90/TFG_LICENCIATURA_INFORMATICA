import { Module } from '@nestjs/common';
import { NotificacionController } from './notificacion.controller';
import { NotificacionService } from './notificacion.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificacionController],
  providers: [NotificacionService, PrismaService],
  exports: [NotificacionService],
})
export class NotificacionModule {}
