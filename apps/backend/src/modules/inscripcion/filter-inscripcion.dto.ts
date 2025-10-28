import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterInscripcionDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  idInscripcionDesafio?: number;

  @IsOptional()
  @IsInt()
  idCliente?: number;

  @IsOptional()
  @IsInt()
  idDesafio?: number;

  @IsOptional()
  @IsInt()
  idEstadoDesafio?: number;

  @IsOptional()
  @IsInt()
  idTipoCliente?: number;

  @IsOptional()
  @IsInt()
  idRolUsuario?: number;
}

export class OrderInscripcionDto extends OrderDto {
  // sortBy idInscripcionDesafio, idCliente, idDesafio, idEstadoDesafio
}
