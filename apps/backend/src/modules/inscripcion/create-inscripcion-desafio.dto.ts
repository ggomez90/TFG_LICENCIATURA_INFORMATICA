import { IsDateString, IsDecimal, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInscripcionDesafioDto {
  @IsInt() @Min(1) idCliente!: number;
  @IsInt() @Min(1) idDesafio!: number;

  @IsDateString() fechaAdhesion!: string; // default "hoy" en servicio si querés
  @IsOptional() @IsDateString() fechaBaja?: string;

  @IsDecimal() progreso!: any; // o @IsNumber() según cómo lo manejes en controlador
  @IsInt() @Min(0) puntosAcumulados!: number;

  @IsInt() @Min(1) estado!: number; // EstadoDesafio (1=ACTIVO)
}
