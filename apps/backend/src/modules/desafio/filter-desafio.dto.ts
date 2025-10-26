import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { DateRangeDto } from '../common/date-range.dto';
import { OrderDto } from '../common/order.dto';

export class FilterDesafioDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) estado?: number;
  // Buscar por rango de fechas de inicio, etc.
}

export class OrderDesafioDto extends OrderDto {
  // sortBy
}
