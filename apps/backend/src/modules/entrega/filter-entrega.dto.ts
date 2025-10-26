import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterEntregaDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) idCliente?: number;
  @IsOptional() @IsInt() @Min(1) idDesafio?: number;
  @IsOptional() @IsInt() @Min(1) estado?: number;

  @IsOptional() @IsInt() @Min(1) idInscripcionDesafio?: number;

  @IsOptional() @IsDateString() fechaDesde?: string;
  @IsOptional() @IsDateString() fechaHasta?: string;
}

export class OrderEntregaDto extends OrderDto {
  // sortBy
}
