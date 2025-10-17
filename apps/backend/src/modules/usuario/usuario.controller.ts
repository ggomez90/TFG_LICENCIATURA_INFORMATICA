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
  ValidationPipe // <- usa esto si NO tenés un ValidationPipe global
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { HabilitarUsuarioDto } from './enable-usuario.dto';
import { BanearUsuarioDto } from './ban-usuario.dto';
import { FilterUsuarioDto } from './filter-usuario.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // ============================
  // Público (sin login)
  // ============================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPublic(@Body() dto: CreateUsuarioDto) {
    // SUGERENCIA seguridad (opcional): el service debería omitir 'clave' en la respuesta.
    return this.usuarioService.create(dto);
  }

  // ============================
  // Solo ADMIN
  // ============================
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  // Si NO tenés ValidationPipe global, descomenta la línea debajo:
  // async findAll(@Query(new ValidationPipe({ transform: true })) filter: FilterUsuarioDto) {
  async findAll(@Query() filter: FilterUsuarioDto) {
    return this.usuarioService.findAll(filter);
  }

  @Patch(':id/enable')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HabilitarUsuarioDto,
  ) {
    return this.usuarioService.enable(id, dto);
  }

  @Patch(':id/ban')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async ban(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanearUsuarioDto,
  ) {
    return this.usuarioService.ban(id, dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuarioService.update(id, dto, { asAdmin: true });
  }

  // ============================
  // Login requerido (cualquier rol)
  // ============================
  @Get('me')
  @UseGuards(KeycloakAuthGuard)
  async me(@User() user: any) {
    // Preferimos un identificador que exista en la BD:
    // - preferred_username (Keycloak) suele mapear a 'usuario'
    // - email (Keycloak) mapearía a 'email'
    // - como último recurso, intentamos sub (si lo hubieras guardado como id)
    const identifier =
      user?.preferred_username ??
      user?.email ??
      user?.username ?? // por si tu decorador lo expone así
      user?.sub;

    return this.usuarioService.findById(identifier);
  }

  @Patch('me')
  @UseGuards(KeycloakAuthGuard)
  async updateMe(@User() user: any, @Body() dto: UpdateUsuarioDto) {
    const identifier =
      user?.preferred_username ??
      user?.email ??
      user?.username ??
      user?.sub;

    return this.usuarioService.updateSelf(identifier, dto);
  }
}
