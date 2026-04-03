import { IsDateString, IsDecimal, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateEntregaDto {
  @IsOptional() @IsInt() @Min(1) idCliente?: number;
  @IsInt() @Min(1) idDesafio!: number;
  @IsInt() @Min(1) idInscripcionDesafio!: number;

  @IsDateString() fechaCreacion!: string;
  @IsDateString() fechaVencimiento!: string;
  @IsOptional() @IsDateString() fechaValidacion?: string;

  @IsDecimal() cantidadDeclarada!: any;
  @IsOptional() @IsDecimal() cantidadVerificada?: any;

  @IsInt() @Min(1) estado!: number;

  @IsOptional() @IsString() @Length(0, 300) observaciones?: string;
  @IsOptional() @IsInt() @Min(1) idOperarioValidador?: number;
  @IsOptional() @IsString() @Length(0, 300) motivoRechazo?: string;
  @IsOptional() @IsString() @Length(0, 100) ubicacion?: string;
}