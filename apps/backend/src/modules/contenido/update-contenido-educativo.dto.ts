import { PartialType } from '@nestjs/mapped-types';
import { CreateContenidoEducativoDto } from './create-contenido-educativo.dto';

export class UpdateContenidoEducativoDto extends PartialType(CreateContenidoEducativoDto) {}
