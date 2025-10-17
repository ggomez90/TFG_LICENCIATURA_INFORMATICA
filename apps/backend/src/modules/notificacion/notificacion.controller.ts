import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { CreateNotificacionDto } from './create-notificacion.dto';
import { UpdateNotificacionDto } from './update-notificacion.dto';
import { UpdateVisibleNotificacionDto } from './update-visible-notificacion.dto';
import { FilterNotificacionDto } from './filter-notificacion.dto';
import { ListNotificacionPublicDto } from './list-notificacion-public.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('notificaciones')
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}

  // =====================================================
  // Público autenticado (OPERARIO / CLIENTE)
  // - visible=true (forzado en service)
  // - orden: fechaCreacion desc
  // - filtrado por rol del usuario autenticado
  // =====================================================
@Get('mias')
@UseGuards(KeycloakAuthGuard, RolesGuard)
@Roles('OPERARIO', 'CLIENTE')
async listForMyRole(@User() user: any, @Query() dto: ListNotificacionPublicDto) {
  return this.notificacionService.listPublic(dto); // <- nuevo nombre sugerido
}

  // =====================================================
  // ADMIN: CRUD + listado con filtros completos
  // =====================================================
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(@Query() filter: FilterNotificacionDto) {
    return this.notificacionService.findAll(filter);
  }

  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateNotificacionDto) {
    return this.notificacionService.create(dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) idNotificacion: number,
    @Body() dto: UpdateNotificacionDto,
  ) {
    return this.notificacionService.update(idNotificacion, dto);
  }

  @Patch(':id/visible')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateVisible(
    @Param('id', ParseIntPipe) idNotificacion: number,
    @Body() dto: UpdateVisibleNotificacionDto,
  ) {
    return this.notificacionService.updateVisible(idNotificacion, dto);
  }

  // --------------- helper ---------------
  private pickRole(user: any): 'ADMIN' | 'OPERARIO' | 'CLIENTE' {
    const roles =
      user?.realm_access?.roles ??
      user?.resource_access?.default?.roles ??
      user?.roles ??
      [];
    if (Array.isArray(roles)) {
      if (roles.includes('ADMIN')) return 'ADMIN';
      if (roles.includes('OPERARIO')) return 'OPERARIO';
      return 'CLIENTE';
    }
    return 'CLIENTE';
  }
}
