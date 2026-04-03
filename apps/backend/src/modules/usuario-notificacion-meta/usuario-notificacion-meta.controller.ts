import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsuarioNotificacionMetaService } from './usuario-notificacion-meta.service';
import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('usuario-notificacion-meta')
export class UsuarioNotificacionMetaController {
  constructor(
    private readonly usuarioNotificacionMetaService: UsuarioNotificacionMetaService,
  ) {}

  @Get('estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('OPERARIO', 'CLIENTE')
  async getEstado(@User() user: any) {
    return this.usuarioNotificacionMetaService.getEstado(user);
  }

  @Patch('marcar-vista')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('OPERARIO', 'CLIENTE')
  async marcarVista(@User() user: any) {
    return this.usuarioNotificacionMetaService.marcarVista(user);
  }
}