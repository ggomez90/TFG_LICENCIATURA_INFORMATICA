import { IsInt } from 'class-validator';

export class UpdateEstadoDesafioDto {
  @IsInt()
  idEstadoDesafio: number; // 1=ACTIVO, 2=PAUSADO, 3=FINALIZADO
}
