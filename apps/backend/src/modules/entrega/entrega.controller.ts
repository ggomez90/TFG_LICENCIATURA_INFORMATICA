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
import { EntregaService } from './entrega.service';
import { CreateEntregaDto } from './create-entrega.dto';
import { UpdateEntregaDto } from './update-entrega.dto';
import { UpdateEstadoEntregaDto } from './update-estado-entrega.dto';
import { FilterEntregaDto } from './filter-entrega.dto';
import { RevisarEntregaOperarioDto } from './revisar-entrega-operario.dto';
import { VolverPendienteEntregaDto } from './volver-pendiente-entrega.dto';
import { ConfirmarPuntosEntregaDto } from './confirmar-puntos-entrega.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('entregas')
export class EntregaController {
  constructor(private readonly entregaService: EntregaService) {}

  //obtener para cualquier tipo de rol
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'OPERARIO', 'CLIENTE')
  async findAll(@User() user: any, @Query() filter: FilterEntregaDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.findAll(filter, { actorRole, identifier });
  }

  //crear
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
  async create(@User() user: any, @Body() dto: CreateEntregaDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.create(dto, { actorRole, identifier });
  }

  //editar
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
  async update(
    @User() user: any,
    @Param('id', ParseIntPipe) idEntrega: number,
    @Body() dto: UpdateEntregaDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.update(idEntrega, dto, { actorRole, identifier });
  }

  //editar estado segun corresponda por rol
  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'OPERARIO', 'CLIENTE')
  async updateEstado(
    @User() user: any,
    @Param('id', ParseIntPipe) idEntrega: number,
    @Body() dto: UpdateEstadoEntregaDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.updateEstado(idEntrega, dto, { actorRole, identifier });
  }

  // OPERARIO: validar o rechazar una entrega pendiente
  @Patch(':id/operario/revisar')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'OPERARIO')
  async revisarOperario(
    @User() user: any,
    @Param('id', ParseIntPipe) idEntrega: number,
    @Body() dto: RevisarEntregaOperarioDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.revisarOperario(idEntrega, dto, { actorRole, identifier });
  }

  // OPERARIO: volver una validada/rechazada a pendiente
  @Patch(':id/operario/volver-pendiente')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'OPERARIO')
  async volverPendienteOperario(
    @User() user: any,
    @Param('id', ParseIntPipe) idEntrega: number,
    @Body() dto: VolverPendienteEntregaDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.volverPendienteOperario(idEntrega, dto, { actorRole, identifier });
  }

  // OPERARIO: confirmar puntos de una entrega validada
  @Patch(':id/operario/confirmar-puntos')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'OPERARIO')
  async confirmarPuntosOperario(
    @User() user: any,
    @Param('id', ParseIntPipe) idEntrega: number,
    @Body() dto: ConfirmarPuntosEntregaDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.confirmarPuntosOperario(idEntrega, dto, { actorRole, identifier });
  }

  //helper para evaluar roles
  private pickRole(user: any): 'ADMIN' | 'ADMINISTRADOR' | 'OPERARIO' | 'CLIENTE' {
    const roles =
      user?.realm_access?.roles ??
      user?.resource_access?.default?.roles ??
      user?.roles ??
      [];

    if (Array.isArray(roles)) {
      if (roles.includes('ADMIN')) return 'ADMIN';
      if (roles.includes('ADMINISTRADOR')) return 'ADMINISTRADOR';
      if (roles.includes('OPERARIO')) return 'OPERARIO';
      if (roles.includes('CLIENTE')) return 'CLIENTE';
    }

    return 'CLIENTE';
  }
}