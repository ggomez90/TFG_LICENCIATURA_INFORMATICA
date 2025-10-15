// src/modules/usuario/banear-usuario.dto.ts
import { IsString, Length } from 'class-validator';

export class BanearUsuarioDto {
  @IsString()
  @Length(5, 300)
  motivo!: string; // obligatorio, para documentar el ban
}
