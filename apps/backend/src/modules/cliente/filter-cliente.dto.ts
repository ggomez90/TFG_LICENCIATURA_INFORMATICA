import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterClienteDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) idProvincia?: number;
  @IsOptional() @IsInt() @Min(1) idLocalidad?: number;
  @IsOptional() @IsInt() @Min(1) idTipoCliente?: number;
}

export class OrderClienteDto extends OrderDto {
  // sortBy sugeridos: 'idCliente','puntos'
}
