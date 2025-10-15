import { IsBoolean } from 'class-validator';

export class UpdateVisibleNotificacionDto {
  @IsBoolean()
  visible!: boolean;
}
// El id de la notificación viaja en la URL (p.ej. PATCH /notificaciones/:id/visible)
