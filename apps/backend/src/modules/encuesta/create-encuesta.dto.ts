import { IsBoolean, IsDateString, IsInt, IsString, Length, Min } from 'class-validator';

export class CreateEncuestaDto {
  @IsInt() @Min(1) idAdmin!: number;
  //se actualizaron extensiones de campos string respecto al modelo anterior
  @IsString() @Length(1, 300) titulo!: string;
  @IsString() @Length(1, 5000) descripcion!: string;

  @IsDateString() fechaPublicacion!: string;
  @IsDateString() fechaCierre!: string;

  @IsBoolean() activa!: boolean;
}
