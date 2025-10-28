//El codigo no posee logica para esta feature, los datos son estaticos y solo decorativos para simular una vista
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type Voucher = {
  id: string;
  titulo: string;
  comercio: string;
  categoria: 'ALIMENTOS' | 'INDUMENTARIA' | 'FARMACIA' | 'OTROS';
  puntos: number;
  vence: string; // ISO o texto
  disponible: boolean;
};

@Component({
  selector: 'app-vouchers-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vouchers-cliente.component.html',
  styleUrls: ['./vouchers-cliente.component.scss'],
})
export class VouchersClienteComponent {
  // Simulacion de puntos del usuario
  misPuntos = signal(1280);

  // Dataset de ejemplo (mock)
  private data = signal<Voucher[]>([
    { id:'v1', titulo:'$2000 en verdulería', comercio:'La Huerta', categoria:'ALIMENTOS', puntos:700,  vence:'30/11/2025', disponible:true },
    { id:'v2', titulo:'$5000 en farmacia',   comercio:'FarmaPlus', categoria:'FARMACIA',  puntos:2100, vence:'31/10/2025', disponible:false },
    { id:'v3', titulo:'10% en indumentaria', comercio:'Moda Ceres', categoria:'INDUMENTARIA', puntos:900, vence:'15/12/2025', disponible:true },
    { id:'v4', titulo:'$1500 en súper',      comercio:'Súper Ceres', categoria:'ALIMENTOS', puntos:600, vence:'08/11/2025', disponible:true },
    { id:'v5', titulo:'2x1 accesorios',      comercio:'TecnoYA', categoria:'OTROS', puntos:1200, vence:'20/12/2025', disponible:true },
  ]);

  // Filtros
  q = signal<string>('');
  cat = signal<'TODOS'|'ALIMENTOS'|'INDUMENTARIA'|'FARMACIA'|'OTROS'>('TODOS');
  soloDisponibles = signal<boolean>(false);

  puedeCanjear = (v: Voucher) => this.misPuntos() >= v.puntos && v.disponible;

  // Lista filtrada
  vouchers = computed(() => {
    const term = this.q().trim().toLowerCase();
    const cat  = this.cat();
    const disp = this.soloDisponibles();
    return this.data().filter(v => {
      const byTerm = !term || (v.titulo + ' ' + v.comercio).toLowerCase().includes(term);
      const byCat  = cat === 'TODOS' || v.categoria === cat;
      const byDisp = !disp || v.disponible;
      return byTerm && byCat && byDisp;
    });
  });

  // Acciones
  setCat(c: 'TODOS'|'ALIMENTOS'|'INDUMENTARIA'|'FARMACIA'|'OTROS'){ this.cat.set(c); }
  toggleDisponibles(){ this.soloDisponibles.update(v => !v); }
  canjear(v: Voucher){
    if (!this.puedeCanjear(v)) return;
    // mock canje
    this.misPuntos.update(p => p - v.puntos);
    alert(`¡Canjeado! "${v.titulo}" en ${v.comercio}`);
  }
}
