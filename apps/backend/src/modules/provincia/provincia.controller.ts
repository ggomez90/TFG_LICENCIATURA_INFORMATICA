import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ProvinciaService } from './provincia.service';
import { AuthGuard } from 'nest-keycloak-connect';
import { FilterProvinciaDto } from './provincia.dto';

@UseGuards(AuthGuard) // ← exige token válido para cualquier rol
@Controller('provincia')
export class ProvinciaController {
  constructor(private readonly provinciaService: ProvinciaService) {}

  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    dto: FilterProvinciaDto,
  ) {
    return this.provinciaService.findAll(dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.provinciaService.findOne(id);
  }
}
