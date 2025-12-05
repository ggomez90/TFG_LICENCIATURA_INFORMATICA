import { IsBoolean, IsDateString, IsInt, IsString, Length, Min } from 'class-validator';

export class CreateVoucherTipoDto {
  @IsInt() @Min(1) idAdmin!: number;

  @IsString() @Length(1, 100) titulo!: string;
  @IsString() @Length(1, 500) descripcion!: string;

  @IsInt() @Min(0) puntosRequeridos!: number;
  @IsInt() @Min(0) montoBeneficio!: number;

  @IsDateString() fechaInicioVigencia!: string;
  @IsDateString() fechaFinVigencia!: string;

  @IsBoolean() activa!: boolean;
}
