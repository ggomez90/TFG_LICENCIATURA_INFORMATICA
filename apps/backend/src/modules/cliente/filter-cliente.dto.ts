import { IsIn, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterClienteAdminDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEstadoUsuario?: number;

  // tipoCliente siempre viene como string:
  // todos = sin filtro
  // pendiente = tipoCliente NULL
  // 1, 2 o 3 se transformará a int para realizar la query
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 'todos';
    const v = String(value).trim().toLowerCase();
    if (v === '0' || v === 'todos') return 'todos';
    if (v === 'null' || v === 'pendiente') return 'pendiente';
    if (['1', '2', '3'].includes(v)) return v as '1' | '2' | '3';
    return 'todos';
  })
  @IsIn(['todos', 'pendiente', '1', '2', '3'])
  tipoCliente?: 'todos' | 'pendiente' | '1' | '2' | '3' = 'todos';

  @IsOptional()
  @IsIn(['idUsuario', 'usuario', 'email', 'idRolUsuario', 'idEstadoUsuario'])
  sortBy?: 'idUsuario' | 'usuario' | 'email' | 'idRolUsuario' | 'idEstadoUsuario';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class FilterClienteDto extends PaginationDto {
  @IsOptional() @IsInt() @Min(1) idProvincia?: number;
  @IsOptional() @IsInt() @Min(1) idLocalidad?: number;
  @IsOptional() @IsInt() @Min(1) idTipoCliente?: number;
  @IsOptional() @IsString() q?: string;
}

export class OrderClienteDto extends OrderDto {}
