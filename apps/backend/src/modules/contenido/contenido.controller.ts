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
  NotFoundException,
  UsePipes,
  ValidationPipe,
  BadRequestException,
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

  // listado de contenidos visibles, endpoint publico
  @Get()
  async listPublic() {
    return this.contenidoService.listPublic();
  }

  // listado completo con filtros solo para admin
  @Get('admin')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  )
  async listAdmin(@Query() filter: FilterContenidoAdminDto) {
    return this.contenidoService.listAdmin(filter);
  }

  // ver un contenido por id (solo si es visible)
  @Get(':id')
  async getPublicById(@Param('id', ParseIntPipe) id: number) {
    const contenido = await this.contenidoService.getPublicById(id);

    if (!contenido) {
      throw new NotFoundException('Contenido educativo no encontrado');
    }

    return contenido;
  }

  // ver un contenido por id (incluye ocultos) solo para admin
  @Get('admin/:id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async getAdminById(@Param('id', ParseIntPipe) id: number) {
    const contenido = await this.contenidoService.getAdminById(id);

    if (!contenido) {
      throw new NotFoundException('Contenido educativo no encontrado');
    }

    return contenido;
  }

  // CREAR / EDITAR / VISIBILIDAD

  // crear contenido solo para admin
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContenidoEducativoDto) {
    return this.contenidoService.create(dto);
  }

  // actualizar, solo adm
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContenidoEducativoDto,
  ) {
    return this.contenidoService.update(id, dto);
  }

  // cambiar visibilidad de contenido, solo admin
  @Patch(':id/visible')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateVisible(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVisibleContenidoDto,
  ) {
    return this.contenidoService.updateVisible(id, dto);
  }
}
