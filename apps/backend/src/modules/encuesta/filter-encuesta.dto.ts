import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

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
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string; // rango sobre fechaPublicacion (inclusive)

  @IsOptional()
  @IsDateString()
  fechaHasta?: string; // rango sobre fechaPublicacion (inclusive)
}
