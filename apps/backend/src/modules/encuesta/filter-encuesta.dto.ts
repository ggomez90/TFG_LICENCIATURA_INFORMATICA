import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';
import { Transform } from 'class-transformer';

export class FilterEncuestaPublicDto extends PaginationDto {
  // Orden
  @IsOptional()
  @IsIn(['fechaPublicacion', 'fechaCierre', 'idEncuesta', 'activa', 'titulo'])
  declare sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  // Filtros
  @IsOptional()
  @IsString()
  q?: string; // búsqueda por título (contains)

  @IsOptional()
  @Transform(({ value }) => {
    // Acepta '1'/'0', 1/0, 'true'/'false', true/false
    if (value === '1' || value === 1) return true;
    if (value === '0' || value === 0) return false;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return value;
  })
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string; // rango sobre fechaPublicacion (inclusive)

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
