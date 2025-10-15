import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateTipoClienteDto {
  @IsInt() @Min(1) idTipoCliente!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateTipoClienteDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterTipoClienteDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;
}
