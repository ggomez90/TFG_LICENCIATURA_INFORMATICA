import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class FilterVoucherTipoClienteDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  soloCanjeables?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['idVoucherTipo', 'fechaInicioVigencia', 'fechaFinVigencia', 'puntosRequeridos', 'montoBeneficio'])
  sortBy?: 'idVoucherTipo' | 'fechaInicioVigencia' | 'fechaFinVigencia' | 'puntosRequeridos' | 'montoBeneficio';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
}