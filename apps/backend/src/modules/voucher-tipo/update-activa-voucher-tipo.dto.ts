import { IsBoolean } from 'class-validator';

export class UpdateActivaVoucherTipoDto {
  @IsBoolean()
  activa!: boolean;
}
//idVoucherTipo viaja por la URL /voucher-tipo/:id/activa
