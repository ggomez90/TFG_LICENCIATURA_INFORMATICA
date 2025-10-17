import { IsDateString, IsOptional } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

// Solo para consumo por OPERARIO/CLIENTE (listado)
export class ListNotificacionPublicDto extends PaginationDto {
  @IsOptional() @IsDateString() desde?: string; // rango por fechaCreacion (inclusive)
  @IsOptional() @IsDateString() hasta?: string;
  // Orden fijo en el servicio: fechaCreacion DESC
}
