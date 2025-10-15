// src/modules/usuario/habilitar-usuario.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HabilitarUsuarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string; // opcional para trazar por qué/quiÉn habilitó
}
