import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateEstadoEntregaDto {
  @IsInt() @Min(1) idEstadoEntrega!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateEstadoEntregaDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterEstadoEntregaDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

  // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
