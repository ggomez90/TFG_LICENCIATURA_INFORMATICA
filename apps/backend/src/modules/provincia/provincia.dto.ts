import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateProvinciaDto {
  @IsInt() @Min(1) idProvincia!: number; // seed controlado
  @IsString() @Length(1, 50) nombre!: string;
}
export class UpdateProvinciaDto { /* normalmente no se edita */ }

export class FilterProvinciaDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;
}
