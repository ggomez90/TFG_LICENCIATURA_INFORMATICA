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
  HttpCode,
  HttpStatus,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { DesafioService } from './desafio.service';
import { CreateDesafioDto } from './create-desafio.dto';
import { UpdateDesafioDto } from './update-desafio.dto';
import { UpdateEstadoDesafioDto } from './update-estado-desafio.dto';
import { FilterDesafioDto } from './filter-desafio.dto';

import { KeycloakAuthGuard, RolesGuard, Roles } from '../../auth';

@Controller('desafios')
export class DesafioController {
  constructor(private readonly desafioService: DesafioService) {}

  // Listado (cualquier rol que este autenticado)
  @Get()
  @UseGuards(KeycloakAuthGuard)
  async findAll(@Query() filter: FilterDesafioDto) {
    return this.desafioService.findAll(filter);
  }

  //Kpis para el dashboard del admin
  @Get('admin/summary')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async getSummary() {
    return this.desafioService.getSummary();
  }

  // Detalle (cualquier rol autenticado)
  @Get(':id')
  @UseGuards(KeycloakAuthGuard)
  async findOne(@Param('id', ParseIntPipe) idDesafio: number) {
    return this.desafioService.findOne(idDesafio);
  }

  //crear nuevos
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateDesafioDto) {
    // toma id numérico del token (el claim custom idUsuario)
    const idFromToken = Number(req?.user?.idUsuario);

    // Si no está en el token se toma el que llega en el body (ya validado por DTO)
    const resolvedIdAdmin = Number.isFinite(idFromToken) ? idFromToken : dto.idAdmin;

    return this.desafioService.createWithAdmin(resolvedIdAdmin, dto);
  }

  //editar
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async update(
    @Param('id', ParseIntPipe) idDesafio: number,
    @Body() dto: UpdateDesafioDto,
  ) {
    return this.desafioService.update(idDesafio, dto);
  }

  
  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateEstado(
    @Param('id', ParseIntPipe) idDesafio: number,
    @Body() dto: UpdateEstadoDesafioDto,
  ) {
    return this.desafioService.updateEstado(idDesafio, dto);
  }
}
