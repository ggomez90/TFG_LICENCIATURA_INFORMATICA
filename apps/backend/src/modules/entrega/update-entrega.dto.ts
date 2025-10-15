import { PartialType } from '@nestjs/mapped-types';
import { CreateEntregaDto } from './create-entrega.dto';

export class UpdateEntregaDto extends PartialType(CreateEntregaDto) {}
