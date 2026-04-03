import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../common/pagination.dto';

export class FilterEntregaDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idDesafio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idInscripcionDesafio?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'idEntrega',
    'fechaCreacion',
    'fechaVencimiento',
    'fechaValidacion',
    'cantidadDeclarada',
    'cantidadVerificada',
    'estado',
    'idCliente',
    'idDesafio',
  ])
  sortBy?:
    | 'idEntrega'
    | 'fechaCreacion'
    | 'fechaVencimiento'
    | 'fechaValidacion'
    | 'cantidadDeclarada'
    | 'cantidadVerificada'
    | 'estado'
    | 'idCliente'
    | 'idDesafio';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
}