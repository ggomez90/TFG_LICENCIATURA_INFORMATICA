import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateEstadoUsuarioDto {
  @IsInt() @Min(1) idEstadoUsuario!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateEstadoUsuarioDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterEstadoUsuarioDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

    // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
