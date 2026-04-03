import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../common/pagination.dto';

export class FilterMovimientoDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTipoMovimiento?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idOrigenMovimiento?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEntrega?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idVoucher?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idAdmin?: number;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsString()
  @IsIn(['fecha', 'puntos', 'idMovimiento'])
  sortBy?: 'fecha' | 'puntos' | 'idMovimiento';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
}