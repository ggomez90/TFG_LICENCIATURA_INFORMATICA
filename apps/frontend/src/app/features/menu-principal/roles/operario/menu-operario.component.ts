import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type QuickLink = { title: string; desc: string; route: string; iconPath: string; };
type TareaAsignada = { punto: string; pendientes: number; direccion: string };
type EntregaMini = { id: number; cliente: string; desafio: string; punto: string; estado: 'PENDIENTE'|'VALIDADA'|'RECHAZADA'; fecha: string };

@Component({
  selector: 'app-menu-operario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-operario.component.html',
  styleUrls: ['./menu-operario.component.scss'],
})
export class MenuOperarioComponent {

  // Métricas rápidas (ficticias)
  entregasPendientesAsignadas = signal(7);
  retirosHoy = signal(5);
  kgProcesadosSemana = signal(168);
  incidenciasAbiertas = signal(1);

  //Accesos rápidos
  links = signal<QuickLink[]>([
    { title: 'Validar entrega', desc: 'Escanear ticket o ingresar código', route: '/operario/entregas', iconPath: 'M3 6h18v2H3zM6 10h12v2H6zM8 14h8v2H8z' },
    { title: 'Registrar retiro', desc: 'Cargar materiales retirados', route: '/operario/retiros', iconPath: 'M4 4h16v4H4V4zm0 6h10v10H4V10zm12 0h4v10h-4V10z' },
    { title: 'Puntos asignados', desc: 'Ver rutas y pendientes', route: '/operario/puntos', iconPath: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z' },
    { title: 'Mi historial', desc: 'Validaciones y retiros previos', route: '/operario/historial', iconPath: 'M5 4h14v2H5V4zm0 4h14v2H5V8zm0 4h10v2H5v-2z' },
  ]);

  //Tareas asignadas (ficticias)
  tareas = signal<TareaAsignada[]>([
    { punto: 'Punto Verde Centro', pendientes: 3, direccion: 'San Martín 250' },
    { punto: 'Escuela N° 412', pendientes: 2, direccion: 'Belgrano 890' },
    { punto: 'Sociedad de Fomento', pendientes: 1, direccion: 'Rivadavia 1300' },
    { punto: 'Plaza Norte', pendientes: 1, direccion: '25 de Mayo y Italia' },
  ]);

  totalPendientes = computed(() => this.tareas().reduce((acc, t) => acc + t.pendientes, 0));

  //Versión con porcentaje para no usar Math en el template
  tareasConPct = computed(() => {
    const tot = this.totalPendientes() || 1;
    return this.tareas().map(t => ({
      ...t,
      pct: (t.pendientes / tot) * 100
    }));
  });

  //Actividad reciente (ficticia)
  ultPendientes = signal<EntregaMini[]>([
    { id: 1101, cliente: 'María Díaz',  desafio: 'EcoBotellas',   punto: 'Centro', estado: 'PENDIENTE', fecha: '2025-10-05' },
    { id: 1102, cliente: 'Juan Pérez',  desafio: 'Papel & Cartón', punto: 'Escuela 412', estado: 'PENDIENTE', fecha: '2025-10-05' },
    { id: 1103, cliente: 'Ana Ruiz',    desafio: 'Vidrio Limpio',  punto: 'Plaza Norte', estado: 'PENDIENTE', fecha: '2025-10-04' },
  ]);

  ultValidadas = signal<EntregaMini[]>([
    { id: 1201, cliente: 'Carlos Soto', desafio: 'EcoBotellas',   punto: 'Centro', estado: 'VALIDADA', fecha: '2025-10-04' },
    { id: 1202, cliente: 'Lucía B.',    desafio: 'Metales',       punto: 'Fomento', estado: 'VALIDADA', fecha: '2025-10-03' },
    { id: 1203, cliente: 'Nadia T.',    desafio: 'Vidrio Limpio', punto: 'Escuela 412', estado: 'VALIDADA', fecha: '2025-10-03' },
  ]);
}
