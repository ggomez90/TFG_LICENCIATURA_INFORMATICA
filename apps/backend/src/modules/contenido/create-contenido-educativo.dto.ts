import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateContenidoEducativoDto {
  @IsInt() @Min(1) idAdmin!: number;

  @IsOptional() @IsString() @Length(0, 300) titulo?: string;
  @IsOptional() @IsString() @Length(0, 500) descripcion?: string;
  @IsOptional() @IsString() @Length(0, 200) urlRecurso?: string;

  @IsDateString() fechaPublicacion!: string;
  @IsOptional() @IsDateString() fechaBaja?: string;

  @IsBoolean() visible!: boolean;
}
