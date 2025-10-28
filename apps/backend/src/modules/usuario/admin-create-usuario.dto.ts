import { IsEmail, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class AdminCreateUsuarioDto {
  @IsString() @Length(1, 100) nombres!: string;
  @IsString() @Length(1, 100) apellidos!: string;

  @IsOptional() @IsString() @Length(0, 20)
  dniCuitCuil?: string;

  @IsString() @Length(1, 80) usuario!: string;
  @IsEmail()  @Length(1, 120) email!: string;

  // Rol OBLIGATORIO (1=ADMIN,2=OPERARIO,3=CLIENTE)
  @IsInt() @Min(1)
  idRolUsuario!: number;

  // Estado siempre PENDIENTE al crear por admin (se habilita tras verificacion)
}
