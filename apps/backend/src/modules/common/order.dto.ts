import { IsIn, IsOptional } from 'class-validator';

export class OrderDto {
  @IsOptional()
  @IsIn(['asc','desc'])
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  sortBy?: string; // nombre del campo a ordenar (validar en servicio)
}
