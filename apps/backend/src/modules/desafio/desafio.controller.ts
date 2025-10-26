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

  // Listado (cualquier rol autenticado)
  @Get()
  @UseGuards(KeycloakAuthGuard)
  async findAll(@Query() filter: FilterDesafioDto) {
    return this.desafioService.findAll(filter);
  }

  // ADMIN
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDesafioDto) {
    return this.desafioService.create(dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) idDesafio: number,
    @Body() dto: UpdateDesafioDto,
  ) {
    return this.desafioService.update(idDesafio, dto);
  }

  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateEstado(
    @Param('id', ParseIntPipe) idDesafio: number,
    @Body() dto: UpdateEstadoDesafioDto,
  ) {
    return this.desafioService.updateEstado(idDesafio, dto);
  }
}
