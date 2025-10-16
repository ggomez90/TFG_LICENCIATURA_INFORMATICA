import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateTipoMovimientoDto {
  @IsInt() @Min(1) idTipoMovimiento!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateTipoMovimientoDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterTipoMovimientoDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

    // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
