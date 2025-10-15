import { PartialType } from '@nestjs/mapped-types';
import { CreateInscripcionDesafioDto } from './create-inscripcion-desafio.dto';

export class UpdateInscripcionDesafioDto extends PartialType(CreateInscripcionDesafioDto) {}
