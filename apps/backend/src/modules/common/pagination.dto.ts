import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

function toNumberOrUndefined({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export class PaginationDto {
  // Esquema de paginacion para mostrar de a 50 resultados
  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;

  // Esquema 2
  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

}
