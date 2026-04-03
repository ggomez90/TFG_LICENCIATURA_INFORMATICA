import { IsDecimal, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class RevisarEntregaOperarioDto {
  @IsIn(['VALIDAR', 'RECHAZAR'])
  accion!: 'VALIDAR' | 'RECHAZAR';

  @IsOptional()
  @IsDecimal()
  cantidadVerificada?: any;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  observaciones?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  motivoRechazo?: string;
}