//El codigo no posee logica para esta feature, los datos son estaticos y solo decorativos para simular una vista
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type VoucherRow = {
  id: string;
  titulo: string;
  comercio: string;
  categoria: 'ALIMENTOS' | 'INDUMENTARIA' | 'FARMACIA' | 'OTROS';
  puntos: number;
  stock: number;
  usado: number;
  activo: boolean;
  vence: string;
};

@Component({
  selector: 'app-vouchers-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vouchers-admin.component.html',
  styleUrls: ['./vouchers-admin.component.scss'],
})
export class VouchersAdminComponent {
  rows = signal<VoucherRow[]>([
    { id:'v1', titulo:'$2000 en verdulería', comercio:'La Huerta', categoria:'ALIMENTOS', puntos:700, stock:120, usado:34,  activo:true,  vence:'30/11/2025' },
    { id:'v2', titulo:'$5000 en farmacia',   comercio:'FarmaPlus', categoria:'FARMACIA',  puntos:2100, stock:50,  usado:49,  activo:false, vence:'31/10/2025' },
    { id:'v3', titulo:'10% en indumentaria', comercio:'Moda Ceres', categoria:'INDUMENTARIA', puntos:900, stock:200, usado:12,  activo:true,  vence:'15/12/2025' },
    { id:'v4', titulo:'$1500 en súper',      comercio:'Súper Ceres', categoria:'ALIMENTOS', puntos:600, stock:300, usado:188, activo:true,  vence:'08/11/2025' },
  ]);

  q = signal<string>('');
  estado = signal<'TODOS'|'ACTIVOS'|'INACTIVOS'>('TODOS');

  filtrados = computed(() => {
    const term = this.q().toLowerCase().trim();
    const est = this.estado();
    return this.rows().filter(r => {
      const t = (r.titulo + ' ' + r.comercio + ' ' + r.categoria).toLowerCase();
      const byTerm = !term || t.includes(term);
      const byEst = est === 'TODOS' || (est === 'ACTIVOS' ? r.activo : !r.activo);
      return byTerm && byEst;
    });
  });

  toggleActivo(r: VoucherRow){ r.activo = !r.activo; this.rows.update(x => [...x]); }
  nuevo(){ alert('Nuevo voucher (ejemplo)'); }
  editar(r: VoucherRow){ alert('Editar: ' + r.titulo); }
  eliminar(r: VoucherRow){
    if (confirm(`¿Eliminar "${r.titulo}"?`)) {
      this.rows.update(list => list.filter(x => x.id !== r.id));
    }
  }
}
