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

  // Podrías ampliar más adelante con:
  // - rango de fechas (fechaAdquisicion / fechaUso)
  // - por tipo de voucher
}

export class OrderVoucherDto extends OrderDto {
  // sortBy sugeridos: 'idVoucher' | 'fechaAdquisicion' | 'fechaUso'
  // sortDir: 'asc' | 'desc'
}
