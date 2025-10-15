import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateOrigenMovimientoDto {
  @IsInt() @Min(1) idOrigenMovimiento!: number;
  @IsString() @Length(1, 50) descripcion!: string;
}
export class UpdateOrigenMovimientoDto {
  @IsOptional() @IsString() @Length(1, 50) descripcion?: string;
}
export class FilterOrigenMovimientoDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;
}
