//El codigo no posee logica para esta feature, los datos son estaticos y solo decorativos para simular una vista
import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe} from '@angular/common';
import { RouterModule } from '@angular/router';

type EstadoEntrega = 'pendiente' | 'aprobada' | 'rechazada';

interface EntregaCliente {
  id: string;
  desafio: string;
  fecha: string; // ISO
  puntos: number;
  estado: EstadoEntrega;
  observaciones?: string;
}

@Component({
  selector: 'app-entregas-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './entregas-cliente.component.html',
  styleUrls: ['./entregas-cliente.component.scss'],
})
export class EntregasClienteComponent {
  // Busqueda y filtro
  q = signal<string>('');
  estado = signal<EstadoEntrega | 'todos'>('todos');

  // Mock de entregas del cliente
  private readonly base = signal<EntregaCliente[]>([
    { id: 'E-001', desafio: 'Papel y cartón limpio', fecha: '2025-09-20', puntos: 50, estado: 'aprobada', observaciones: 'Excelente separación' },
    { id: 'E-002', desafio: 'Plásticos PET (botellas)', fecha: '2025-09-28', puntos: 30, estado: 'rechazada', observaciones: 'Contenía líquidos' },
    { id: 'E-003', desafio: 'Vidrio sin etiquetas', fecha: '2025-10-02', puntos: 40, estado: 'pendiente' },
    { id: 'E-004', desafio: 'Metales (latas)', fecha: '2025-10-05', puntos: 25, estado: 'aprobada' },
  ]);

  entregas = computed(() => {
    const q = this.q().trim().toLowerCase();
    const estado = this.estado();
    return this.base().filter(e => {
      const byQ = !q || e.desafio.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
      const byEstado = estado === 'todos' ? true : e.estado === estado;
      return byQ && byEstado;
    });
  });

  // helpers UI
  estadoLabel(e: EstadoEntrega) {
    return e === 'pendiente' ? 'Pendiente'
         : e === 'aprobada'  ? 'Aprobada'
         : 'Rechazada';
  }
  estadoBadgeClass(e: EstadoEntrega) {
    return e === 'aprobada' ? 'ok'
         : e === 'rechazada' ? 'err'
         : 'warn';
  }

  onEstadoChange(value: 'todos' | 'pendiente' | 'aprobada' | 'rechazada') {
    this.estado.set(value);
  }
}
