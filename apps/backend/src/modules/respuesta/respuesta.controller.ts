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
import { RespuestaService } from './respuesta.service';
import { CreateRespuestaEncuestaDto } from './create-respuesta-encuesta.dto';
import { UpdateRespuestaEncuestaDto } from './update-respuesta-encuesta.dto';
import { FilterRespuestaDto } from './filter-respuesta.dto';

import { KeycloakAuthGuard, User } from '../../auth';

@Controller('respuestas')
export class RespuestaController {
  constructor(private readonly respuestaService: RespuestaService) {}

  // Publico sin login
  @Post()
  async createPublic(@Body() dto: CreateRespuestaEncuestaDto) {
    return this.respuestaService.create(dto);
  }

  // Login requerido cualquier rol
  @Get()
  @UseGuards(KeycloakAuthGuard)
  async findAll(@User() user: any, @Query() filter: FilterRespuestaDto) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.respuestaService.findAll(filter, { identifier });
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard)
  async update(
    @User() user: any,
    @Param('id', ParseIntPipe) idRespuesta: number,
    @Body() dto: UpdateRespuestaEncuestaDto,
  ) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.respuestaService.update(idRespuesta, dto, { identifier });
  }
}
