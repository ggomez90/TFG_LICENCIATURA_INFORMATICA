import { IsEmail, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateUsuarioDto {
  @IsOptional()
  @IsString()
  @Length(0, 100)
  nombres?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  apellidos?: string;

  @IsString()
  @Length(1, 20)
  dniCuitCuil!: string;

  @IsString()
  @Length(1, 80)
  usuario!: string;

  @IsEmail()
  @Length(1, 120)
  email!: string;

  @IsString()
  // 8+ chars, al menos 1 mayúscula y 1 número (según política acordada)
  @Matches(/^(?=.*[A-Z])(?=.*\d).{8,}$/)
  @Length(8, 255)
  clave!: string;

  @IsInt()
  @Min(1)
  idRolUsuario!: number; // por defecto 3 (CLIENTE) lo aplicás en servicio si no viene

  @IsInt()
  @Min(1)
  idEstadoUsuario!: number; // por defecto 1 (PENDIENTE) en servicio
}
