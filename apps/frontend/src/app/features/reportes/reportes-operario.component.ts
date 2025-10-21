import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Estado = 'VALIDADA' | 'RECHAZADA' | 'PENDIENTE';
type EstadoFiltro = 'TODAS' | Estado;

interface EntregaRpt {
  id: number;
  fecha: string; // YYYY-MM-DD
  cliente: string;
  punto: string;
  desafio: string;
  estado: Estado;
  kg: number;
}

@Component({
  selector: 'app-reportes-operario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-operario.component.html',
  styleUrls: ['./reportes-operario.component.scss'],
})
export class ReportesOperarioComponent {

  // ===== Utilidades de fecha =====
  private toDate(d: string): Date {
    // Espera YYYY-MM-DD
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, day ?? 1);
  }
  private todayStr(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  // ====== Filtros ======
  desde = signal<string>('2025-10-01');
  hasta  = signal<string>(this.todayStr());
  estado = signal<EstadoFiltro>('TODAS');

  onDesdeChange(v: string) {
    if (v) this.desde.set(v);
  }

  onHastaChange(v: string) {
    if (v) this.hasta.set(v);
  }
  onEstadoChange(v: string) {
    const up = v.toUpperCase() as EstadoFiltro;
    if (up === 'TODAS' || up === 'VALIDADA' || up === 'RECHAZADA' || up === 'PENDIENTE') {
      this.estado.set(up);
    }
  }

  // ====== Datos ficticios ======
  private base = signal<EntregaRpt[]>([
    { id: 1401, fecha: '2025-10-01', cliente: 'Juan Pérez',   punto: 'Centro',       desafio: 'EcoBotellas',   estado: 'VALIDADA',  kg: 3.2 },
    { id: 1402, fecha: '2025-10-01', cliente: 'Ana Ruiz',     punto: 'Plaza Norte',  desafio: 'Vidrio Limpio', estado: 'RECHAZADA', kg: 0.0 },
    { id: 1403, fecha: '2025-10-02', cliente: 'María Díaz',   punto: 'Escuela 412',  desafio: 'Papel & Cartón',estado: 'VALIDADA',  kg: 5.0 },
    { id: 1404, fecha: '2025-10-02', cliente: 'Carlos Soto',  punto: 'Fomento',      desafio: 'Metales',       estado: 'PENDIENTE', kg: 0.0 },
    { id: 1405, fecha: '2025-10-03', cliente: 'Lucía Benítez',punto: 'Centro',       desafio: 'EcoBotellas',   estado: 'VALIDADA',  kg: 2.6 },
    { id: 1406, fecha: '2025-10-03', cliente: 'Nadia Torres', punto: 'Plaza Norte',  desafio: 'Vidrio Limpio', estado: 'VALIDADA',  kg: 7.8 },
    { id: 1407, fecha: '2025-10-04', cliente: 'Pablo Gómez',  punto: 'Escuela 412',  desafio: 'Papel & Cartón',estado: 'RECHAZADA', kg: 0.0 },
    { id: 1408, fecha: '2025-10-04', cliente: 'Sofía Ríos',   punto: 'Fomento',      desafio: 'Metales',       estado: 'VALIDADA',  kg: 4.1 },
    { id: 1409, fecha: '2025-10-05', cliente: 'Agus Molina',  punto: 'Centro',       desafio: 'EcoBotellas',   estado: 'PENDIENTE', kg: 0.0 },
    { id: 1410, fecha: '2025-10-05', cliente: 'Leo Pérez',    punto: 'Plaza Norte',  desafio: 'Vidrio Limpio', estado: 'VALIDADA',  kg: 6.4 },
    { id: 1411, fecha: '2025-10-05', cliente: 'Vale C.',      punto: 'Fomento',      desafio: 'Metales',       estado: 'VALIDADA',  kg: 1.9 },
    { id: 1412, fecha: '2025-10-06', cliente: 'Mati S.',      punto: 'Escuela 412',  desafio: 'Papel & Cartón',estado: 'VALIDADA',  kg: 3.7 },
  ]);

  // ====== Filtrado ======
  filtradas = computed(() => {
    const d = this.toDate(this.desde());
    const h = this.toDate(this.hasta());
    const est = this.estado();
    return this.base().filter(e => {
      const ef = this.toDate(e.fecha);
      const inRange = ef >= d && ef <= h;
      const matchEstado = (est === 'TODAS') ? true : (e.estado === est);
      return inRange && matchEstado;
    });
  });

  // ====== Métricas ======
  totalReg   = computed(() => this.filtradas().length);
  totalKg    = computed(() => this.filtradas().reduce((acc, r) => acc + r.kg, 0));
  cantVal    = computed(() => this.filtradas().filter(r => r.estado === 'VALIDADA').length);
  cantRech   = computed(() => this.filtradas().filter(r => r.estado === 'RECHAZADA').length);
  cantPend   = computed(() => this.filtradas().filter(r => r.estado === 'PENDIENTE').length);

  compValidPct = computed(() => {
    const tot = Math.max(1, this.totalReg());
    return (this.cantVal() / tot) * 100;
  });
  compRechaPct = computed(() => {
    const tot = Math.max(1, this.totalReg());
    return (this.cantRech() / tot) * 100;
  });
  compPendPct = computed(() => {
    const tot = Math.max(1, this.totalReg());
    return (this.cantPend() / tot) * 100;
  });

  // ====== Paginación ======
  page = signal(1);
  pageSize = signal(10);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalReg() / this.pageSize())));

  visible = computed(() => {
    const pz = this.pageSize();
    const start = (this.page() - 1) * pz;
    return this.filtradas().slice(start, start + pz);
  });

setPage(p: number) {
  const tp = this.totalPages();
  if (p >= 1 && p <= tp) this.page.set(p);
}

  prevPage() { this.setPage(this.page() - 1); }
  nextPage() { this.setPage(this.page() + 1); }

  // ====== Exportar CSV ======
  exportCSV() {
    const rows = [
      ['ID','Fecha','Cliente','Punto','Desafío','Estado','Kg'],
      ...this.filtradas().map(r => [
        r.id, r.fecha, r.cliente, r.punto, r.desafio, r.estado, r.kg
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reportes-operario_${this.desde()}_${this.hasta()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  trackById(index: number, item: any) {
    return item.id;
  }

}
