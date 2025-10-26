import { IsBoolean } from 'class-validator';

export class UpdateActivaVoucherTipoDto {
  @IsBoolean()
  activa!: boolean;
}
//idVoucherTipo viaja por la URL PATCH /voucher-tipo/:id/activa
