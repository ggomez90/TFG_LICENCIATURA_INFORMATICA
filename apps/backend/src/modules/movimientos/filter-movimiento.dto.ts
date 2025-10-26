import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterMovimientoDto extends PaginationDto {
  // Filtro principal
  @IsOptional()
  @IsInt()
  @Min(1)
  idCliente?: number;

  // Filtros adicionales
  @IsOptional()
  @IsInt()
  @Min(1)
  idTipoMovimiento?: number;       // CREDITO/DEBITO (tabla catálogo)

  @IsOptional()
  @IsInt()
  @Min(1)
  idOrigenMovimiento?: number;     // ENTREGA/VOUCHER/AJUSTE (tabla catálogo)

  // Otros posibles vínculos (opcionales)
  @IsOptional()
  @IsInt()
  @Min(1)
  idEntrega?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idVoucher?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idAdmin?: number;

  // Rango de fechas (ISO 8601)
  @IsOptional()
  @IsDateString()
  desde?: string;                  // inclusive

  @IsOptional()
  @IsDateString()
  hasta?: string;                  // inclusive
}

export class OrderMovimientoDto extends OrderDto {
  // sortBy fecha, puntos, idmovimiento
  // sortDir ascendente o descendente
}
