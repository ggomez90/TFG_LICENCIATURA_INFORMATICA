import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateNotificacionDto {
  @IsInt()
  @Min(1)
  idRolUsuario!: number;

  @IsString()
  @Length(1, 100)
  titulo!: string;

  @IsString()
  @Length(1, 300)
  mensaje!: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}