import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateRolUsuarioDto {
  @IsInt() @Min(1) idRolUsuario!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateRolUsuarioDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterRolUsuarioDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;

    // hereda de OrderDto las propiedades order y sortBy
  order?: 'ASC' | 'DESC';
  sortBy?: string;
}
