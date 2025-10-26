import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterRespuestaDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  idEncuesta?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idUsuario?: number;

  @IsOptional()
  @IsBoolean()
  invitado?: boolean;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  // Busqueda por coincidencia parcial (ILIKE/contains) en el campo contenido
  @IsOptional()
  @IsString()
  contenidoLike?: string;
}

export class OrderRespuestaDto extends OrderDto {
  // sortBy idRespuesta, fechaRespuesta, idEncuesta, idUsuario
  // sortDir
}
