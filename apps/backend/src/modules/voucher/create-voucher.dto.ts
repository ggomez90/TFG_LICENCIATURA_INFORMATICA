import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateVoucherDto {
  @IsInt() @Min(1) idCliente!: number;
  @IsInt() @Min(1) idVoucherTipo!: number;

  @IsInt() @Min(1) estadoVoucher!: number; // default 2=ADQUIRIDO

  @IsDateString() fechaAdquisicion!: string;
  @IsOptional() @IsDateString() fechaUso?: string;
}
