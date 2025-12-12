import { IsBoolean, IsDateString, IsInt, IsString, Length, Min, IsOptional } from 'class-validator';

export class CreateVoucherTipoDto {
  @IsOptional() @IsInt() @Min(1) idAdmin?: number;

  @IsString() @Length(1, 100) titulo!: string;
  @IsString() @Length(1, 500) descripcion!: string;

  @IsInt() @Min(1) puntosRequeridos!: number;
  @IsInt() @Min(1) montoBeneficio!: number;

  @IsDateString() fechaInicioVigencia!: string;
  @IsDateString() fechaFinVigencia!: string;

  @IsBoolean() activa!: boolean;
}
