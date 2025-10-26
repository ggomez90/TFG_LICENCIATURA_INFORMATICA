import { IsInt, IsOptional, Min, IsString } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterClienteDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) idProvincia?: number;
  @IsOptional() @IsInt() @Min(1) idLocalidad?: number;
  @IsOptional() @IsInt() @Min(1) idTipoCliente?: number;
  @IsOptional() @IsString() q?: string; // busqueda por nombre/apellido/razon social
}

export class OrderClienteDto extends OrderDto {

}
