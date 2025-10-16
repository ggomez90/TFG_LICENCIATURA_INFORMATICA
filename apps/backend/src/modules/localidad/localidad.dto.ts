import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

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

export class FilterLocalidadDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) idProvincia?: number;
  @IsOptional() @IsString() q?: string;

  // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
