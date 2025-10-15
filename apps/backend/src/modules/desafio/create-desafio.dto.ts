import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateDesafioDto {
  @IsInt() @Min(1) idAdmin!: number;

  @IsString() @Length(1, 100) titulo!: string;
  @IsString() @Length(1, 500) descripcion!: string;

  @IsString() @Length(1, 100) tipoResiduo!: string;

  @IsBoolean() requiereInscripcion!: boolean;

  @IsString() @Length(1, 50) unidadMedida!: string;

  @IsNumber() meta!: number;
  @IsInt() @Min(0) puntosTotales!: number;

  @IsOptional() @IsNumber() puntosPorUnidad?: number;
  @IsOptional() @IsInt() @Min(0) bonificacionDesafioCompleto?: number;

  @IsBoolean() otorgaPuntosParcial!: boolean;

  @IsDateString() fechaInicio!: string;
  @IsOptional() @IsDateString() fechaFin?: string;

  @IsInt() @Min(1) estado!: number; // FK EstadoDesafio

  @IsOptional() @IsInt() @Min(1) idRecursoEducativo?: number;
}
