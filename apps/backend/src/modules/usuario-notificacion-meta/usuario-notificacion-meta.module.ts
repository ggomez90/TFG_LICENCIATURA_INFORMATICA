import { Module } from '@nestjs/common';
import { UsuarioNotificacionMetaController } from './usuario-notificacion-meta.controller';
import { UsuarioNotificacionMetaService } from './usuario-notificacion-meta.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsuarioNotificacionMetaController],
  providers: [UsuarioNotificacionMetaService, PrismaService],
  exports: [UsuarioNotificacionMetaService],
})
export class UsuarioNotificacionMetaModule {}