import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type Rol = 'ADMIN' | 'OPERARIO' | 'CLIENTE';

interface SeriePunto {
  fecha: string; // ISO yyyy-mm-dd
  valor: number;
}

interface DesafioTop {
  nombre: string;
  entregas: number;
  kg: number;
  cumplimientoPct: number; // 0..1
}

@Component({
  selector: 'app-indicadores-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './indicadores-administrador.component.html',
  styleUrls: ['./indicadores-administrador.component.scss'],
})
export class IndicadoresAdministradorComponent {
  // === Filtros (ficticios) ===
  rangoDias = signal<number>(90);

  // === Datos mock (últimos 6 meses) ===
  private hoy = new Date();

  private generarSerie(len = 180, base = 10, varianza = 0.35): SeriePunto[] {
    const arr: SeriePunto[] = [];
    for (let i = len - 1; i >= 0; i--) {
      const d = new Date(this.hoy);
      d.setDate(d.getDate() - i);
      const ruido = (Math.random() * 2 - 1) * varianza * base;
      const tendencia = base * (1 + i / (len * 12)); // leve tendencia
      const valor = Math.max(0, Math.round(tendencia + ruido));
      arr.push({ fecha: d.toISOString().slice(0, 10), valor });
    }
    return arr;
  }

  // Series diarias (ejemplo)
  serieUsuariosNuevos = signal<SeriePunto[]>(this.generarSerie(180, 6));
  serieVouchersAdquiridos = signal<SeriePunto[]>(this.generarSerie(180, 12));
  serieVouchersCanjeados = signal<SeriePunto[]>(this.generarSerie(180, 7));
  serieDesafiosCreados = signal<SeriePunto[]>(this.generarSerie(180, 2));
  serieCumplimiento = signal<SeriePunto[]>(
    this.generarSerie(180, 70, 0.08).map(p => ({ ...p, valor: Math.min(100, Math.max(40, p.valor)) }))
  );

  // Distribución por material (kg) – ficticia
  materiales = signal([
    { material: 'Plástico PET', kg: 1280 },
    { material: 'Cartón', kg: 980 },
    { material: 'Aluminio', kg: 430 },
    { material: 'Vidrio', kg: 760 },
    { material: 'Papel blanco', kg: 520 },
  ]);

  // Top desafíos – ficticio
  topDesafios = signal<DesafioTop[]>([
    { nombre: 'Mes Verde Septiembre', entregas: 312, kg: 420, cumplimientoPct: 0.82 },
    { nombre: 'Reto Botellas PET', entregas: 266, kg: 355, cumplimientoPct: 0.74 },
    { nombre: 'Cartón Responsable', entregas: 199, kg: 305, cumplimientoPct: 0.69 },
    { nombre: 'Aluminio+Escuelas', entregas: 154, kg: 188, cumplimientoPct: 0.63 },
    { nombre: 'Vidrio x Barrio', entregas: 141, kg: 176, cumplimientoPct: 0.58 },
  ]);

  // Totales por rol – ficticios
  totalUsuarios = signal(3250);
  totalPorRol = signal<Record<Rol, number>>({
    ADMIN: 4,
    OPERARIO: 18,
    CLIENTE: 3228,
  });

  // === Computados según rango ===
  private filtrarRango = (serie: SeriePunto[]) => {
    const dias = this.rangoDias();
    const desde = new Date(this.hoy);
    desde.setDate(desde.getDate() - dias + 1);
    const iso = desde.toISOString().slice(0, 10);
    return serie.filter(p => p.fecha >= iso);
  };

  usuariosNuevosRango = computed(() =>
    this.filtrarRango(this.serieUsuariosNuevos()).reduce((acc, p) => acc + p.valor, 0)
  );
  vouchersAdquiridosRango = computed(() =>
    this.filtrarRango(this.serieVouchersAdquiridos()).reduce((acc, p) => acc + p.valor, 0)
  );
  vouchersCanjeadosRango = computed(() =>
    this.filtrarRango(this.serieVouchersCanjeados()).reduce((acc, p) => acc + p.valor, 0)
  );
  desafiosCreadosRango = computed(() =>
    this.filtrarRango(this.serieDesafiosCreados()).reduce((acc, p) => acc + p.valor, 0)
  );
  cumplimientoPromedioRango = computed(() => {
    const datos = this.filtrarRango(this.serieCumplimiento());
    const prom = datos.reduce((acc, p) => acc + p.valor, 0) / Math.max(1, datos.length);
    return Math.round(prom);
  });

  totalKg = computed(() => this.materiales().reduce((acc, m) => acc + m.kg, 0));

  // === Handlers ===
onRangoChange(v: string) {
  const n = Number(v);
  if (n === 30 || n === 90 || n === 180) {
    this.rangoDias.set(n);   // <-- escribir en el signal
  }
}

  // === Utilidades ===
  formatPct(n: number): string {
    return `${n}%`;
  }
  formatInt(n: number): string {
    return new Intl.NumberFormat('es-AR').format(Math.round(n));
  }


  // Evita usar Math directamente en el template
totalKgSafe = computed(() => Math.max(1, this.totalKg()));
  pct(kg: number): number {
  return (kg / this.totalKgSafe()) * 100;
}

  // trackBy helpers
  trackByIndex = (i: number) => i;
  trackByNombre = (i: number, item: DesafioTop) => item.nombre;
}
