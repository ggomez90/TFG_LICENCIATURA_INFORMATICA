import { IsInt, IsOptional, IsString, Length, Min, IsIn } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateProvinciaDto {
  @IsInt() @Min(1) idProvincia!: number; // seed controlado
  @IsString() @Length(1, 50) nombre!: string;
}
export class UpdateProvinciaDto { /* no hay nada que editar aca */ }

export class FilterProvinciaDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsIn(['nombre', 'idProvincia'])
  sortBy?: 'nombre' | 'idProvincia';
}