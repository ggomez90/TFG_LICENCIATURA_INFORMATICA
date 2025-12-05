import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateContenidoEducativoDto {
  @IsInt() @Min(1) idAdmin!: number;
  //se incrementaron extensiones de datos string y se corrió migracion
  @IsOptional() @IsString() @Length(0, 300) titulo?: string;
  @IsOptional() @IsString() @Length(0, 2000) descripcion?: string;
  @IsOptional() @IsString() @Length(0, 300) urlRecurso?: string;

  @IsDateString() fechaPublicacion!: string;
  @IsOptional() @IsDateString() fechaBaja?: string;

  @IsBoolean() visible!: boolean;
}
