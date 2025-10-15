import { IsBoolean } from 'class-validator';

export class UpdateActivaEncuestaDto {
  @IsBoolean()
  activa: boolean;
}
