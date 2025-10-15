import { IsInt } from 'class-validator';

export class UpdateEstadoEntregaDto {
  @IsInt()
  idEstadoEntrega: number; // Ej: 2=PENDIENTE, 3=VALIDADA, 4=RECHAZADA, etc.
}
