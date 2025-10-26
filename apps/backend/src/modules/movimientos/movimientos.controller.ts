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
import { MovimientosService } from './movimientos.service';
import { CreateMovimientoPuntosDto } from './create-movimiento-puntos.dto';
import { UpdateMovimientoPuntosDto } from './update-movimiento-puntos.dto';
import { FilterMovimientoDto } from './filter-movimiento.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  // Listado (login requerido)
  // Cliente ve solo sus movimientos
  //Admin ve todos
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async findAll(@User() user: any, @Query() filter: FilterMovimientoDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.movimientosService.findAll(filter, { actorRole, identifier });
  }

  // Crear (solo ADMIN desde API)
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateMovimientoPuntosDto) {
    return this.movimientosService.createByAdmin(dto);
  }

  // Update solo ADMIN
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) idMovimiento: number,
    @Body() dto: UpdateMovimientoPuntosDto,
  ) {
    return this.movimientosService.updateByAdmin(idMovimiento, dto);
  }

  //helpers
  private pickRole(user: any): 'ADMIN' | 'CLIENTE' {
    const roles =
      user?.realm_access?.roles ??
      user?.resource_access?.default?.roles ??
      user?.roles ??
      [];
    if (Array.isArray(roles) && roles.includes('ADMIN')) return 'ADMIN';
    return 'CLIENTE';
  }
}
