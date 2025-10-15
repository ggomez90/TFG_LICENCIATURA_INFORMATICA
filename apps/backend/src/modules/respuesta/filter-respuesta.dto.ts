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

  /**
   * Interpretación en el servicio:
   * - invitado === true  => where datosInvitado IS NOT NULL AND datosInvitado <> ''
   * - invitado === false => where datosInvitado IS NULL OR datosInvitado = ''
   * - undefined          => no filtra por invitado
   */
  @IsOptional()
  @IsBoolean()
  invitado?: boolean;

  /** ISO 8601 (inclusive). Ej: '2025-10-01' o '2025-10-01T00:00:00Z' */
  @IsOptional()
  @IsDateString()
  desde?: string;

  /** ISO 8601 (inclusive). */
  @IsOptional()
  @IsDateString()
  hasta?: string;

  /** Búsqueda por coincidencia parcial (ILIKE/contains) en el campo `contenido`. */
  @IsOptional()
  @IsString()
  contenidoLike?: string;
}

export class OrderRespuestaDto extends OrderDto {
  // sortBy sugeridos: 'idRespuesta' | 'fechaRespuesta' | 'idEncuesta' | 'idUsuario'
  // sortDir: 'asc' | 'desc'
}
