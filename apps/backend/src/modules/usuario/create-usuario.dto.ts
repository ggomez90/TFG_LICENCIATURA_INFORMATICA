// apps/backend/src/modules/usuario/create-usuario.dto.ts
import { IsEmail, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateUsuarioDto {
  @IsOptional() @IsString() @Length(0, 100) nombres?: string;
  @IsOptional() @IsString() @Length(0, 100) apellidos?: string;
  @IsString() @Length(1, 20) dniCuitCuil?: string;

  @IsString() @Length(1, 80) usuario!: string;
  @IsEmail() @Length(1, 120) email!: string;

  // Defaults aplicados en el service (3 = CLIENTE, 1 = PENDIENTE)
  @IsOptional() @IsInt() @Min(1) idRolUsuario?: number;
  @IsOptional() @IsInt() @Min(1) idEstadoUsuario?: number;
}
