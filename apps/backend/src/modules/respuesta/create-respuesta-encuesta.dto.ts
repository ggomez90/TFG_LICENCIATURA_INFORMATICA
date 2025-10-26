import { IsDateString, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateRespuestaEncuestaDto {
  @IsInt() @Min(1) idEncuesta!: number;

  @IsOptional() @IsInt() @Min(1) idUsuario?: number; // nullable por si es invitado
  @IsOptional() @IsString() @Length(0, 100) datosInvitado?: string;
  @IsOptional() @IsString() @Length(0, 20) dniCuilCuitInvitado?: string;

  @IsDateString() fechaRespuesta!: string;

  @IsString() @Length(1, 300) contenido!: string;
}
