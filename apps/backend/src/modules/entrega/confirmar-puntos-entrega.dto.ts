import { IsOptional, IsString, Length } from 'class-validator';

export class ConfirmarPuntosEntregaDto {
  @IsOptional()
  @IsString()
  @Length(0, 300)
  observaciones?: string;
}