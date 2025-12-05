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
  UsePipes,
  ValidationPipe,
  BadRequestException,
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

  // listado con filtros publico
  @Get()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        // console.warn('[DTO Validation Error][Encuestas]', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    }),
  )
  async listPublic(@Query() filter: FilterEncuestaPublicDto) {
    return this.encuestaService.listPublic(filter);
  }

  // get de encuesta por id publico
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.encuestaService.getOne(id);
  }

  // crear, solo admin
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEncuestaDto) {
    return this.encuestaService.create(dto);
  }

  // actualizar, solo admin
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEncuestaDto,
  ) {
    return this.encuestaService.update(id, dto);
  }

  // activar/cerrar solo admin
  @Patch(':id/activa')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateActiva(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivaEncuestaDto,
  ) {
    return this.encuestaService.updateActiva(id, dto);
  }
}
