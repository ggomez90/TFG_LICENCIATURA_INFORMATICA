import { IsDateString, IsDecimal, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateEntregaDto {
  @IsInt() @Min(1) idCliente!: number;
  @IsInt() @Min(1) idDesafio!: number;
  @IsInt() @Min(1) idInscripcionDesafio!: number;

  @IsDateString() fechaCreacion!: string;
  @IsDateString() fechaVencimiento!: string; // +15 días (lo podés calcular en servicio)
  @IsOptional() @IsDateString() fechaValidacion?: string;

  @IsDecimal() cantidadDeclarada!: any;
  @IsOptional() @IsDecimal() cantidadVerificada?: any;

  @IsInt() @Min(1) estado!: number; // EstadoEntrega (2=PENDIENTE)

  @IsOptional() @IsString() @Length(0, 300) observaciones?: string;
  @IsOptional() @IsInt() @Min(1) idOperarioValidador?: number;
  @IsOptional() @IsString() @Length(0, 300) motivoRechazo?: string;
  @IsOptional() @IsString() @Length(0, 100) ubicacion?: string;
}
