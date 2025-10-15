import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { DateRangeDto } from '../common/date-range.dto';
import { OrderDto } from '../common/order.dto';

export class FilterEntregaDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) idCliente?: number;
  @IsOptional() @IsInt() @Min(1) idDesafio?: number;
  @IsOptional() @IsInt() @Min(1) estado?: number;
}

export class OrderEntregaDto extends OrderDto {
  // sortBy sugeridos: 'fechaCreacion','fechaValidacion'
}
