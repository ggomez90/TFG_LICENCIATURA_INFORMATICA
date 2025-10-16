import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateEstadoVoucherDto {
  @IsInt() @Min(1) idEstadoVoucher!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateEstadoVoucherDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterEstadoVoucherDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

    // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
