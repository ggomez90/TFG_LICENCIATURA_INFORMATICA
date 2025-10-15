import { PartialType } from '@nestjs/mapped-types';
import { CreateRespuestaEncuestaDto } from './create-respuesta-encuesta.dto';

export class UpdateRespuestaEncuestaDto extends PartialType(CreateRespuestaEncuestaDto) {}
