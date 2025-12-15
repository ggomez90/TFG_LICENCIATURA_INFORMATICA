import { IsInt, Min } from 'class-validator';

export class UpdateEstadoVoucherDto {
  @IsInt()
  @Min(1)
  idEstadoVoucher!: number;
}
//idVoucher viaja en la URL /vouchers/:id/estado
