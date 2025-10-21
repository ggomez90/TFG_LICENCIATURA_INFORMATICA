import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Noticia = { id: number; titulo: string; resumen: string; fecha: string; fuente?: string; link?: string };
type Actividad = { id: number; titulo: string; detalle: string; fecha: string; puntos?: number };
type Desafio = { id: number; titulo: string; vence: string; puntos: number; detalle?: string };

@Component({
  selector: 'app-menu-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-cliente.component.html',
  styleUrls: ['./menu-cliente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuClienteComponent {
  noticias: Noticia[] = [
    { id: 1, titulo: 'Nueva campaña de reciclaje escolar', resumen: 'Se suman 5 escuelas al programa municipal.', fecha: '2025-09-18', fuente: 'Prensa municipal', link: '#' },
    { id: 2, titulo: 'Puntos verdes ampliados', resumen: 'Apertura de un nuevo punto verde en tu zona.', fecha: '2025-09-16', fuente: 'Municipalidad', link: '#' },
    { id: 3, titulo: 'Guía rápida: separar residuos', resumen: 'Descargá el PDF con tips actualizados.', fecha: '2025-09-12', fuente: 'Yo Reciclo', link: '#' },
  ];

  actividadReciente: Actividad[] = [
    { id: 1, titulo: 'Registro creado', detalle: 'Tu cuenta fue creada correctamente.', fecha: '2025-09-20' },
    { id: 2, titulo: 'Perfil completado', detalle: 'Agregaste tu domicilio y teléfono.', fecha: '2025-09-21' },
    { id: 3, titulo: 'Preferencias guardadas', detalle: 'Activaste notificaciones por email.', fecha: '2025-09-22' },
  ];

  proximosDesafios: Desafio[] = [
    { id: 1, titulo: 'Semana del Papel', vence: '2025-10-05', puntos: 150, detalle: 'Entregá papel limpio y seco.' },
    { id: 2, titulo: 'Plásticos PET', vence: '2025-10-14', puntos: 200, detalle: 'Botellas PET sin etiquetas.' },
    { id: 3, titulo: 'E-waste en casa', vence: '2025-10-21', puntos: 250, detalle: 'Pequeños electrónicos en desuso.' },
  ];

  trackById(_: number, item: { id: number }) { return item.id; }
}
