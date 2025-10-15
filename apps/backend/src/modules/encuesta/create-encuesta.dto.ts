import { IsBoolean, IsDateString, IsInt, IsString, Length, Min } from 'class-validator';

export class CreateEncuestaDto {
  @IsInt() @Min(1) idAdmin!: number;

  @IsString() @Length(1, 100) titulo!: string;
  @IsString() @Length(1, 500) descripcion!: string;

  @IsDateString() fechaPublicacion!: string;
  @IsDateString() fechaCierre!: string;

  @IsBoolean() activa!: boolean;
}
