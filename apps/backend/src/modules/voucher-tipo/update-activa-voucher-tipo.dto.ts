import { IsBoolean } from 'class-validator';

export class UpdateActivaVoucherTipoDto {
  @IsBoolean()
  activa!: boolean;
}
// El idVoucherTipo viaja por la URL (p.ej. PATCH /voucher-tipo/:id/activa)
