import { IsBoolean } from 'class-validator';

export class UpdateVisibleContenidoDto {
  @IsBoolean()
  visible: boolean;
}
