import { IsEmail, IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class FilterUsuarioDto extends PaginationDto {
  // busqueda por texto
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // filtro por id rolUsuario o idEstadoUsuario
  @IsOptional()
  @IsInt()
  @Min(1)
  idRolUsuario?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEstadoUsuario?: number;

  // filtro por tipo de rol textual
  @IsOptional()
  @IsIn(['todos', 'admin', 'operario', 'cliente'])
  tipo?: 'todos' | 'admin' | 'operario' | 'cliente';

  // filtro por tipoCliente para usuarios cuyo idRol es 3 (cliente)
  @IsOptional()
  @IsIn(['todos', 'pendiente', '1', '2', '3'])
  tipoCliente?: 'todos' | 'pendiente' | '1' | '2' | '3';

  // offset en 0 y limit 10 o 50 segun corresponda
  // @IsOptional()
  // @IsInt()
  // @Min(0)
  // offset?: number;
  //
  // @IsOptional()
  // @IsInt()
  // @Min(1)
  // limit?: number;

  // orden unificado
  @IsOptional()
  @IsIn(['idUsuario', 'usuario', 'email', 'idRolUsuario', 'idEstadoUsuario'])
  sortBy?: 'idUsuario' | 'usuario' | 'email' | 'idRolUsuario' | 'idEstadoUsuario';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
