import { IsInt, Min } from 'class-validator';

export class UpdateEstadoVoucherDto {
  @IsInt()
  @Min(1)
  idEstadoVoucher!: number;
}
// El idVoucher viaja en la URL (p.ej. PATCH /vouchers/:id/estado)
