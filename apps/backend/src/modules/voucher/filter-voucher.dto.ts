import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterVoucherDto extends PaginationDto {

  @IsOptional()
  @IsInt()
  @Min(1)
  idVoucher?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEstadoVoucher?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idVoucherTipo?: number;
}

// opcional
export class OrderVoucherDto extends OrderDto {}
