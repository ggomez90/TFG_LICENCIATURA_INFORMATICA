import { IsInt, IsOptional, IsString, Length, Min, IsIn } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { Transform } from 'class-transformer';

export class CreateLocalidadDto {
  @IsInt() @Min(1) idLocalidad!: number; // seed controlado
  @IsString() @Length(1, 50) nombre!: string;
  @IsInt() @Min(1) idProvincia!: number;
}
export class UpdateLocalidadDto { 
    @IsOptional() @IsString() @Length(1, 50)
  nombre?: string;

  @IsOptional() @IsInt() @Min(1)
  idProvincia?: number;
 }

function toNumberOrUndefined({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export class FilterLocalidadDto extends PaginationDto {
  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(1)
  idProvincia?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsIn(['idLocalidad', 'nombre', 'idProvincia'])
  sortBy?: 'idLocalidad' | 'nombre' | 'idProvincia';
}