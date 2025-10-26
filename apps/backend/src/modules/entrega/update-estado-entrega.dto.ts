import { IsInt } from 'class-validator';

export class UpdateEstadoEntregaDto {
  @IsInt()
  idEstadoEntrega: number; //ver taba EstadoEntregas
}
