import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ContenidoService } from './contenido.service';
import { CreateContenidoEducativoDto } from './create-contenido-educativo.dto';
import { UpdateContenidoEducativoDto } from './update-contenido-educativo.dto';
import { UpdateVisibleContenidoDto } from './update-visible-contenido.dto';
import { FilterContenidoAdminDto } from './filter-contenido-admin.dto';

import { KeycloakAuthGuard, RolesGuard, Roles } from '../../auth';

@Controller('contenidos')
export class ContenidoController {
  constructor(private readonly contenidoService: ContenidoService) {}

  // Publico
  @Get()
  async listPublic() {
    return this.contenidoService.listPublic();
  }

  // Solo ADMIN: listado completo con filtros/orden/paginacion
  @Get('admin')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listAdmin(@Query() filter: FilterContenidoAdminDto) {
    return this.contenidoService.listAdmin(filter);
  }

  // Solo ADMIN: create/update/visible
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContenidoEducativoDto) {
    return this.contenidoService.create(dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContenidoEducativoDto,
  ) {
    return this.contenidoService.update(id, dto);
  }

  @Patch(':id/visible')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateVisible(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisibleContenidoDto,
  ) {
    return this.contenidoService.updateVisible(id, dto);
  }
}
