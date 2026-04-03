import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../common/pagination.dto';

export class FilterVoucherDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idVoucher?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEstadoVoucher?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idVoucherTipo?: number;

  @IsOptional()
  @IsString()
  @IsIn(['idVoucher', 'fechaAdquisicion', 'fechaUso'])
  sortBy?: 'idVoucher' | 'fechaAdquisicion' | 'fechaUso';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
}