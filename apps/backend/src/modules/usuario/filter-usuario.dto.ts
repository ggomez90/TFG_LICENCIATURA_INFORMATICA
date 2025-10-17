import { IsEmail, IsInt, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { OrderDto } from '../common/order.dto';

export class FilterUsuarioDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string; // búsqueda libre por nombre/usuario

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  idRolUsuario?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idEstadoUsuario?: number;
}

export class OrderUsuarioDto extends OrderDto {
  @IsOptional()
  @IsIn(['idUsuario', 'usuario', 'email', 'idRolUsuario', 'idEstadoUsuario']) declare sortBy?: string;
}
