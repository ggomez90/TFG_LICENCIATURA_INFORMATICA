import { IsBoolean, IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterNotificacionDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  idAdmin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRolUsuario?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsDateString()
  desde?: string;   // inclusive (ISO 8601)

  @IsOptional()
  @IsDateString()
  hasta?: string;   // inclusive (ISO 8601)
}

export class OrderNotificacionDto extends OrderDto {
  // sortBy sugeridos: 'fechaCreacion' | 'idNotificacion' | 'titulo'
  // sortDir: 'asc' | 'desc'
}
