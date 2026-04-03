import { IsInt, Min } from 'class-validator';

export class AdquirirVoucherClienteDto {
  @IsInt()
  @Min(1)
  idVoucherTipo!: number;
}