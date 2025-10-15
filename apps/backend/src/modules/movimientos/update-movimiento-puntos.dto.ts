import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientoPuntosDto } from './create-movimiento-puntos.dto';

export class UpdateMovimientoPuntosDto extends PartialType(CreateMovimientoPuntosDto) {}
