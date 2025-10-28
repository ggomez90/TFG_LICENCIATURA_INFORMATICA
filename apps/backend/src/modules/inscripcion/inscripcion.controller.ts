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
import { InscripcionService } from './inscripcion.service';
import { CreateInscripcionDesafioDto } from './create-inscripcion-desafio.dto';
import { UpdateInscripcionDesafioDto } from './update-inscripcion-desafio.dto';
import { UpdateEstadoInscripcionDto } from './update-estado-inscripcion.dto';
import { FilterInscripcionDto } from './filter-inscripcion.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('inscripciones')
export class InscripcionController {
  constructor(private readonly inscripcionService: InscripcionService) {}

  // Listado (login requerido)
  //Cliente ve solo sus inscripciones
  //Operario/Admin ven todas
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  async findAll(@User() user: any, @Query() filter: FilterInscripcionDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.inscripcionService.findAll(filter, { actorRole, identifier });
  }

  // Crear (ADMIN o CLIENTE)
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async create(@User() user: any, @Body() dto: CreateInscripcionDesafioDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.inscripcionService.create(dto, { actorRole, identifier });
  }

  // Update (ADMIN o CLIENTE)
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async update(
    @User() user: any,
    @Param('id', ParseIntPipe) idInscripcionDesafio: number,
    @Body() dto: UpdateInscripcionDesafioDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.inscripcionService.update(idInscripcionDesafio, dto, { actorRole, identifier });
  }

  // Update Estado (ADMIN o CLIENTE)
  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async updateEstado(
    @User() user: any,
    @Param('id', ParseIntPipe) idInscripcionDesafio: number,
    @Body() dto: UpdateEstadoInscripcionDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.inscripcionService.updateEstado(idInscripcionDesafio, dto, { actorRole, identifier });
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
