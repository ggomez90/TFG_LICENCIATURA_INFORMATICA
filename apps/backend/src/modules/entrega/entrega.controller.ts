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

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('entregas')
export class EntregaController {
  constructor(private readonly entregaService: EntregaService) {}

  //Listado (login requerido)
  //Cliente: ve solo sus entregas
  // Operario/Admin ven todas
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  async findAll(@User() user: any, @Query() filter: FilterEntregaDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.findAll(filter, { actorRole, identifier });
  }

  // Crear (ADMIN o CLIENTE)
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async create(@User() user: any, @Body() dto: CreateEntregaDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.entregaService.create(dto, { actorRole, identifier });
  }

  // Update (ADMIN o CLIENTE) — solo si estado actual == CREADA (1)
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
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

  // Update Estado (ADMIN, OPERARIO o CLIENTE)
  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
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

  //helpers
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
