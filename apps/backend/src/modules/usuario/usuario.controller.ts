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
import { AdminCreateUsuarioDto } from './admin-create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { HabilitarUsuarioDto } from './enable-usuario.dto';
import { BanearUsuarioDto } from './ban-usuario.dto';
import { FilterUsuarioDto } from './filter-usuario.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Publico
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPublic(@Body() dto: CreateUsuarioDto) {
    return this.usuarioService.create(dto);
  }

  // Autenticado (cualquier rol)

  // crea/actualiza el usuario local en BD segun el token
  @Get('me/sync')
  @UseGuards(KeycloakAuthGuard)
  async syncMe(@User() user: any) {
    return this.usuarioService.meAndSync(user);
  }

  // Perfil propio
  @Get('me')
  @UseGuards(KeycloakAuthGuard)
  async me(@User() user: any) {
    return this.usuarioService.meAndSync(user);
  }

  //editar perfil propio
  @Patch('me')
  @UseGuards(KeycloakAuthGuard)
  async updateMe(@User() user: any, @Body() dto: UpdateUsuarioDto) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.usuarioService.updateSelf(identifier, dto);
  }

  // Solo ADMIN

  //Alta por administrador (crea en KC + asigna rol + envia mail + crea en BD con estado PENDIENTE).
  @Post('admin')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @HttpCode(HttpStatus.CREATED)
  async createByAdmin(@Body() dto: AdminCreateUsuarioDto) {
    return this.usuarioService.createByAdmin(dto);
  }

  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async findAll(@Query() filter: FilterUsuarioDto) {
    return this.usuarioService.findAll(filter);
  }

  //obtiene usuario por id - solo admin
  @Get(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOneById(id);
  }

  @Patch(':id/enable')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HabilitarUsuarioDto,
  ) {
    return this.usuarioService.enable(id, dto);
  }

  @Patch(':id/ban')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async ban(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanearUsuarioDto,
  ) {
    return this.usuarioService.ban(id, dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuarioService.update(id, dto, { asAdmin: true });
  }
}
