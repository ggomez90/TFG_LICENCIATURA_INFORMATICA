import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterContenidoAdminDto extends PaginationDto {
  // Orden
  @IsOptional()
  @IsIn(['fechaPublicacion', 'idContenido', 'visible', 'idAdmin', 'titulo'])
  declare sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  // Filtros
  @IsOptional()
  @IsInt()
  @Min(1)
  idAdmin?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string; // inclusive

  @IsOptional()
  @IsDateString()
  fechaHasta?: string; // inclusive

  @IsOptional()
  @IsString()
  q?: string; // buscar por titulo/descripcion
}
