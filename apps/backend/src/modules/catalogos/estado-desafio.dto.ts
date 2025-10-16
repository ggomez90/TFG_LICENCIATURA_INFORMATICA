import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateEstadoDesafioDto {
  @IsInt() @Min(1) idEstadoDesafio!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateEstadoDesafioDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterEstadoDesafioDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

  // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
