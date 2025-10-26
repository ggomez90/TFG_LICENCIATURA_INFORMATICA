import { IsBoolean, IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterVoucherTipoDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  idAdmin?: number;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsDateString()
  desde?: string;  // fechaInicioVigencia >= desde

  @IsOptional()
  @IsDateString()
  hasta?: string;  // fechaFinVigencia <= hasta
}

export class OrderVoucherTipoDto extends OrderDto {
  // sortBy idVoucherTipo, fechaInicioVigencia, fechaFinVigencia, puntosRequeridos
  // sortDir asc, desc
}
