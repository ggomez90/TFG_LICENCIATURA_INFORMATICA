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

  // Pub autenticado (OPERARIO / CLIENTE)
  // - visible=true (forzado en service)
  // - orden: fechaCreacion desc
  // - filtrado por rol del usuario autenticado
  @Get('mias')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('OPERARIO', 'CLIENTE')
  async listForMyRole(@User() user: any, @Query() dto: ListNotificacionPublicDto) {
    return this.notificacionService.listPublic(user, dto);
  }

  // ADMIN: CRUD + listado con filtros completos
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async findAll(@Query() filter: FilterNotificacionDto) {
    return this.notificacionService.findAll(filter);
  }

  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async create(@User() user: any, @Body() dto: CreateNotificacionDto) {
    return this.notificacionService.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async update(
    @Param('id', ParseIntPipe) idNotificacion: number,
    @Body() dto: UpdateNotificacionDto,
  ) {
    return this.notificacionService.update(idNotificacion, dto);
  }

  @Patch(':id/visible')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateVisible(
    @Param('id', ParseIntPipe) idNotificacion: number,
    @Body() dto: UpdateVisibleNotificacionDto,
  ) {
    return this.notificacionService.updateVisible(idNotificacion, dto);
  }
}