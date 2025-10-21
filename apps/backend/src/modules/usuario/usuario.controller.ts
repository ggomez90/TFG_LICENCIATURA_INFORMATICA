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
    return this.usuarioService.create(dto);
  }

  // ============================
  // Autenticado (cualquier rol)
  // ============================

  // Idempotente: crea/actualiza el usuario local en BD según el token
  @Get('me/sync')
  @UseGuards(KeycloakAuthGuard)
  async syncMe(@User() user: any) {
    return this.usuarioService.meAndSync(user);
  }

  // Perfil "propio" (reutiliza sync para garantizar que existe)
  @Get('me')
  @UseGuards(KeycloakAuthGuard)
  async me(@User() user: any) {
    return this.usuarioService.meAndSync(user);
  }

  @Patch('me')
  @UseGuards(KeycloakAuthGuard)
  async updateMe(@User() user: any, @Body() dto: UpdateUsuarioDto) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.usuarioService.updateSelf(identifier, dto);
  }

  // ============================
  // Solo ADMIN
  // ============================
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
}
