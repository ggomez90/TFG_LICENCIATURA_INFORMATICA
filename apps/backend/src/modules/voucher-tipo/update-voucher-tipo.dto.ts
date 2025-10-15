import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherTipoDto } from './create-voucher-tipo.dto';

export class UpdateVoucherTipoDto extends PartialType(CreateVoucherTipoDto) {}
