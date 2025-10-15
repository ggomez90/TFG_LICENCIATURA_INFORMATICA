import { PartialType } from '@nestjs/mapped-types';
import { CreateDesafioDto } from './create-desafio.dto';

export class UpdateDesafioDto extends PartialType(CreateDesafioDto) {}
