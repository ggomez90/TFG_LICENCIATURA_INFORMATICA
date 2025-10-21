import { Component, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

type EstadoEntrega = 'pendiente' | 'aprobada' | 'rechazada';

interface EntregaOperario {
  id: string;
  ciudadano: string;
  desafio: string;
  fecha: string; // ISO
  pesoKg: number;
  estado: EstadoEntrega;
  notas?: string;
}

@Component({
  selector: 'app-entregas-operario',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './entregas-operario.component.html',
  styleUrls: ['./entregas-operario.component.scss'],
})
export class EntregasOperarioComponent {
  q = signal<string>('');
  estado = signal<EstadoEntrega | 'todos'>('pendiente'); // operario entra viendo "pendiente"

  private readonly base = signal<EntregaOperario[]>([
    { id: 'R-101', ciudadano: 'María López', desafio: 'Papel y cartón limpio', fecha: '2025-10-05', pesoKg: 3.2, estado: 'pendiente' },
    { id: 'R-102', ciudadano: 'Juan Pérez', desafio: 'Plásticos PET', fecha: '2025-10-04', pesoKg: 1.8, estado: 'pendiente' },
    { id: 'R-099', ciudadano: 'Ana Gómez', desafio: 'Vidrio sin etiquetas', fecha: '2025-10-01', pesoKg: 5.0, estado: 'aprobada', notas: 'Buen estado' },
    { id: 'R-097', ciudadano: 'Carlos Díaz', desafio: 'Metales (latas)', fecha: '2025-09-28', pesoKg: 2.1, estado: 'rechazada', notas: 'Material contaminado' },
  ]);

  entregas = computed(() => {
    const q = this.q().trim().toLowerCase();
    const estado = this.estado();
    return this.base().filter(e => {
      const byQ = !q || e.ciudadano.toLowerCase().includes(q) || e.desafio.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
      const byEstado = estado === 'todos' ? true : e.estado === estado;
      return byQ && byEstado;
    });
  });

  aprobar(id: string) {
    this.base.update(list => list.map(e => e.id === id ? { ...e, estado: 'aprobada', notas: 'Validada en recepción' } : e));
  }
  rechazar(id: string) {
    this.base.update(list => list.map(e => e.id === id ? { ...e, estado: 'rechazada', notas: 'Rechazada en control' } : e));
  }

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
