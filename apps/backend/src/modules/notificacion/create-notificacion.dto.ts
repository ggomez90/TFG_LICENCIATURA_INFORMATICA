import { IsBoolean, IsDateString, IsInt, IsString, Length, Min } from 'class-validator';

export class CreateNotificacionDto {
  @IsInt() @Min(1) idAdmin!: number;
  @IsInt() @Min(1) idRolUsuario!: number;

  @IsString() @Length(1, 100) titulo!: string;
  @IsString() @Length(1, 300) mensaje!: string;

  @IsDateString() fechaCreacion!: string;

  @IsBoolean() visible!: boolean;
}
