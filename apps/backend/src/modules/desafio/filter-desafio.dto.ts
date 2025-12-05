import { IsInt, IsOptional, Min, Max, IsIn, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterDesafioDto extends PaginationDto {
  // 1=ACTIVO, 2=PAUSADO, 3=FINALIZADO
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  estado?: number;

  // 1 = requiere inscripción, 0 = no
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  requiereInscripcion?: 0 | 1;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  tipoResiduo?: string;

  // Fechas YYYY-MM-DD para la bd, en front va DD/MM/YYYY
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaDesde?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaHasta?: string;
}

export class OrderDesafioDto extends OrderDto {

}
