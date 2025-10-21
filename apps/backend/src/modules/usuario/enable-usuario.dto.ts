// src/modules/usuario/enable-usuario.dto.ts
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class HabilitarUsuarioDto {
  /** Estado nuevo del usuario (1=PENDIENTE, 2=HABILITADO, 3=BANEADO) */
  @IsOptional()
  @IsInt()
  idEstadoUsuario?: number;

  /** Observación o comentario opcional sobre la habilitación */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string;
}
