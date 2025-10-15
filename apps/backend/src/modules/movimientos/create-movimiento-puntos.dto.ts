import { IsDateString, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateMovimientoPuntosDto {
  @IsInt() @Min(1) idCliente!: number;

  @IsDateString() fecha!: string; // o lo seteás por servicio = hoy

  @IsInt() @Min(1) tipo!: number;    // FK TipoMovimiento (1/2)
  @IsInt() @Min(1) origen!: number;  // FK OrigenMovimiento (ENTREGA/VOUCHER/AJUSTE)

  @IsInt() @Min(0) puntos!: number;

  @IsOptional() @IsString() @Length(0, 100) descripcion?: string;

  @IsOptional() @IsInt() @Min(1) idEntrega?: number;
  @IsOptional() @IsInt() @Min(1) idVoucher?: number;
  @IsOptional() @IsInt() @Min(1) idAdmin?: number;
}
