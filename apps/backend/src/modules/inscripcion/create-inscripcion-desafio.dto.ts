import { IsDateString, IsDecimal, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInscripcionDesafioDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  idCliente?: number;

  @IsInt()
  @Min(1)
  idDesafio!: number;

  @IsDateString()
  fechaAdhesion!: string;

  @IsOptional()
  @IsDateString()
  fechaBaja?: string;

  @IsDecimal()
  progreso!: any;

  @IsInt()
  @Min(0)
  puntosAcumulados!: number;

  @IsInt()
  @Min(1)
  estado!: number; // EstadoDesafio (1=ACTIVO)
}