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
import { EncuestaService } from './encuesta.service';
import { CreateEncuestaDto } from './create-encuesta.dto';
import { UpdateEncuestaDto } from './update-encuesta.dto';
import { UpdateActivaEncuestaDto } from './update-activa-encuesta.dto';
import { FilterEncuestaPublicDto } from './filter-encuesta.dto';

import { KeycloakAuthGuard, RolesGuard, Roles } from '../../auth';

@Controller('encuestas')
export class EncuestaController {
  constructor(private readonly encuestaService: EncuestaService) {}

  // ============================
  // Público (sin login)
  // ============================
  @Get()
  async listPublic(@Query() filter: FilterEncuestaPublicDto) {
    return this.encuestaService.listPublic(filter);
  }

  // ============================
  // Solo ADMIN
  // ============================
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEncuestaDto) {
    return this.encuestaService.create(dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEncuestaDto,
  ) {
    return this.encuestaService.update(id, dto);
  }

  @Patch(':id/activa')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateActiva(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivaEncuestaDto,
  ) {
    return this.encuestaService.updateActiva(id, dto);
  }
}
