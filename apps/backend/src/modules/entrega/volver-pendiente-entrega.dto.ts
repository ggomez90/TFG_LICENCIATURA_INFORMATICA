import { IsOptional, IsString, Length } from 'class-validator';

export class VolverPendienteEntregaDto {
  @IsOptional()
  @IsString()
  @Length(0, 300)
  observaciones?: string;
}