import { Component, computed, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { UsuariosApi, UsuarioDto } from '../../../../api/usuarios.api';
import { DesafioApi, DesafioItem, DesafioSummaryResponse } from '../../../../api/desafio.api';
import { VoucherApi, VoucherListItem } from '../../../../api/voucher.api';
import { EntregasApi, EntregaListItem, EstadoEntregaCode } from '../../../../api/entrega.api';

type QuickLink = {
  title: string;
  desc: string;
  route: string;
  iconPath: string;
};

type UsuarioMini = { id: number; nombre: string; tipo: 'ADMIN'|'OPERARIO'|'CLIENTE'; email: string; };
type DesafioMini = { id: number; titulo: string; estado: 'ACTIVO'|'PAUSADO'|'FINALIZADO'; inicio?: string; fin?: string; };
type VoucherMini = { id: number; clienteId: number; tipoId: number; estado: 'CREADO'|'ADQUIRIDO'|'UTILIZADO'|'ANULADO'; fecha: string; };
type EntregaMini = { id: number; clienteId: number; desafioId: number; estado: 'CREADA'|'PENDIENTE'|'VALIDADA'|'RECHAZADA'|'PUNTOS'|'ANULADA'; fecha: string; };

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-admin.component.html',
  styleUrls: ['./menu-admin.component.scss'],
})
export class MenuAdminComponent {
  private usuariosApi = inject(UsuariosApi);
  private desafioApi = inject(DesafioApi);
  private voucherApi = inject(VoucherApi);
  private entregasApi = inject(EntregasApi);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  error = signal<string | null>(null);

  // ======= KPIs (reales) =======
  usuariosTotal = signal(0);
  usuariosAdmin = signal(0);
  usuariosOperarios = signal(0);
  usuariosClientes = computed(() => Math.max(0, this.usuariosTotal() - this.usuariosAdmin() - this.usuariosOperarios()));

  desafiosActivos = signal(0);
  vouchersMesAdquiridos = signal(0);
  entregasPendientes = signal(0);

  // Sub-kpis extra “lindos”
  desafiosPausados = signal(0);
  desafiosFinalizados = signal(0);
  vouchersUtilizadosMes = signal(0);

  // ======= Actividad reciente =======
  ultUsuarios = signal<UsuarioMini[]>([]);
  ultDesafios = signal<DesafioMini[]>([]);
  ultVouchers = signal<VoucherMini[]>([]);
  ultEntregas = signal<EntregaMini[]>([]);

  // ======= Accesos rápidos (RUTAS REALES) =======
  links = signal<QuickLink[]>([
    { title: 'Usuarios', desc: 'Altas, bajas, edición y búsqueda', route: '/menu-principal/admin/usuarios', iconPath: 'M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z' },

    { title: 'Desafíos', desc: 'Crear, editar y monitorear', route: '/menu-principal/admin/desafios', iconPath: 'M4 4h16v4H4V4zm0 6h10v10H4V10zm12 0h4v10h-4V10z' },
    { title: 'Listado desafíos', desc: 'Ver todos con filtros', route: '/menu-principal/admin/desafios/listado', iconPath: 'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z' },
    { title: 'Nuevo desafío', desc: 'Crear un desafío nuevo', route: '/menu-principal/admin/desafios/nuevo', iconPath: 'M19 11H13V5h-2v6H5v2h6v6h2v-6h6v-2z' },

    { title: 'Vouchers', desc: 'Tipos, cupos y canjes', route: '/menu-principal/admin/vouchers', iconPath: 'M4 6h16v4H4zM4 14h16v4H4z' },
    { title: 'Tipos de voucher', desc: 'Crear, editar y listar tipos', route: '/menu-principal/admin/vouchers/voucher-tipo/listar', iconPath: 'M4 4h16v6H4V4zm0 10h16v6H4v-6z' },
    { title: 'Crear voucher', desc: 'Emitir un voucher a un cliente', route: '/menu-principal/admin/vouchers/voucher/crear', iconPath: 'M12 2l4 4-4 4-4-4 4-4zm-7 9h14v11H5V11z' },

    { title: 'Biblioteca', desc: 'Contenidos educativos y encuestas', route: '/menu-principal/admin/biblioteca', iconPath: 'M4 5h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5z' },
    { title: 'Contenidos', desc: 'Listado compartido', route: '/menu-principal/biblioteca/contenidos', iconPath: 'M4 6h16v2H4V6zm0 4h10v2H4v-2zm0 4h16v2H4v-2z' },
    { title: 'Encuestas', desc: 'Listado compartido', route: '/menu-principal/biblioteca/encuestas', iconPath: 'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h12v2H3v-2z' },

    { title: 'Indicadores', desc: 'Más adelante lo refinamos', route: '/menu-principal/admin/indicadores', iconPath: 'M5 19V8h3v11H5zm5 0V5h3v14h-3zm5 0v-7h3v7h-3z' },
  ]);

  // ======= Lifecycle =======
  ngOnInit(): void {
    this.loadDashboard();
  }

  onRefresh(): void {
    this.loadDashboard();
  }

  // ======= Loaders =======
  private loadDashboard(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const { desdeMesIso, hastaHoyIso } = this.getMonthRangeIso();

    // 1) Usuarios: contadores + últimos
    const usuariosCounters$ = this.usuariosApi.fetchAllForCounters().pipe(
      catchError(() => of([] as UsuarioDto[]))
    );

    const usuariosRecientes$ = this.usuariosApi.queryAdmin({
      page: 1,
      pageSize: 5,
      sortBy: 'idUsuario',
      order: 'desc',
    } as any).pipe(
      catchError(() => of({ items: [] } as any))
    );

    // 2) Desafíos summary + últimos
    const desafiosSummary$ = this.desafioApi.getSummary().pipe(
      catchError(() =>
        of({
          total: 0,
          activos: 0,
          pausados: 0,
          finalizados: 0,
          inscripcionesTotales: 0,
        } as DesafioSummaryResponse)
      )
    );

    const desafiosRecientes$ = this.desafioApi.listDesafios({
      limit: 5,
      sortBy: 'fechaInicio',
      order: 'desc',
    }).pipe(
      catchError(() => of({ items: [], total: 0, limit: 5, offset: 0 } as any))
    );

    // 3) Vouchers: traemos un lote y calculamos
    const vouchersAll$ = this.voucherApi.list({
      limit: 100,
      offset: 0,
    } as any).pipe(
      catchError(() => of({ items: [], total: 0, limit: 500, offset: 0 } as any))
    );

    // 4) Entregas: pendientes + recientes
    const entregasPendientes$ = this.entregasApi.listDashboard({
      limit: 50,
      offset: 0,
      estado: 2,
      sortBy: 'idEntrega',
      order: 'desc',
    }).pipe(
      catchError(() => of({ items: [], total: 0, limit: 50, offset: 0 } as any))
    );

    const entregasRecientes$ = this.entregasApi.listDashboard({
      limit: 5,
      offset: 0,
      sortBy: 'idEntrega',
      order: 'desc',
    }).pipe(
      catchError(() => of({ items: [], total: 0, limit: 5, offset: 0 } as any))
    );

    forkJoin({
      usuariosCounters: usuariosCounters$,
      usuariosRecientes: usuariosRecientes$,
      desafiosSummary: desafiosSummary$,
      desafiosRecientes: desafiosRecientes$,
      vouchersAll: vouchersAll$,
      entregasPendientes: entregasPendientes$,
      entregasRecientes: entregasRecientes$,
    }).pipe(
      finalize(() => this.loading.set(false)),
      catchError((err) => {
        console.error('Error dashboard admin', err);
        this.error.set('No se pudieron cargar los datos del panel.');
        return of(null);
      })
    ).subscribe((res) => {
      if (!res) return;

      // --- Usuarios counters ---
      const all = res.usuariosCounters ?? [];
      const total = all.length;
      const admins = all.filter(u => Number(u.idRolUsuario) === 1).length;
      const ops = all.filter(u => Number(u.idRolUsuario) === 2).length;

      this.usuariosTotal.set(total);
      this.usuariosAdmin.set(admins);
      this.usuariosOperarios.set(ops);

      // --- Usuarios recientes ---
      const ur = res.usuariosRecientes as any;
      const uItems: UsuarioDto[] = Array.isArray(ur?.items)
        ? ur.items
        : (Array.isArray(ur) ? ur : []);

      this.ultUsuarios.set(
        uItems.slice(0, 5).map(u => ({
          id: Number(u.idUsuario),
          nombre: this.nombreUsuario(u),
          tipo: this.rolTexto(u.idRolUsuario),
          email: String(u.email ?? ''),
        }))
      );

      // --- Desafíos summary + recientes ---
      this.desafiosActivos.set(Number(res.desafiosSummary?.activos ?? 0));
      this.desafiosPausados.set(Number(res.desafiosSummary?.pausados ?? 0));
      this.desafiosFinalizados.set(Number(res.desafiosSummary?.finalizados ?? 0));

      const dItems: DesafioItem[] = (res.desafiosRecientes as any)?.items ?? [];
      this.ultDesafios.set(
        dItems.slice(0, 5).map(d => ({
          id: Number(d.idDesafio),
          titulo: this.toPlainText(String(d.titulo ?? `Desafío #${d.idDesafio}`)),
          estado: this.desafioEstadoTexto(Number(d.estado)),
          inicio: this.fmtDate(d.fechaInicio),
          fin: this.fmtDate(d.fechaFin as any),
        }))
      );

      // --- Vouchers (mes + recientes) calculados en front ---
      const vAll: VoucherListItem[] = (res.vouchersAll as any)?.items ?? [];

      const inMonth = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return false;
        const ymd = d.toISOString().slice(0, 10);
        return ymd >= desdeMesIso && ymd <= hastaHoyIso;
      };

      const vMes = vAll.filter(v => inMonth(v.fechaAdquisicion));

      this.vouchersMesAdquiridos.set(
        vMes.filter(v => Number(v.estadoVoucher) === 2).length
      );
      this.vouchersUtilizadosMes.set(
        vMes.filter(v => Number(v.estadoVoucher) === 3).length
      );

      const vSorted = [...vAll].sort((a, b) => Number(b.idVoucher) - Number(a.idVoucher));
      this.ultVouchers.set(
        vSorted.slice(0, 5).map(v => ({
          id: Number(v.idVoucher),
          clienteId: Number(v.idCliente),
          tipoId: Number(v.idVoucherTipo),
          estado: this.voucherEstadoTexto(Number(v.estadoVoucher)),
          fecha: this.fmtDate(v.fechaAdquisicion),
        }))
      );

      // --- Entregas pendientes + recientes ---
      const ePend = res.entregasPendientes as any;
      const pendientesTotal =
        Number(ePend?.total ?? 0) > 0
          ? Number(ePend.total)
          : Array.isArray(ePend?.items)
            ? ePend.items.length
            : 0;

      this.entregasPendientes.set(pendientesTotal);

      const eItems: EntregaListItem[] = (res.entregasRecientes as any)?.items ?? [];
      this.ultEntregas.set(
        eItems.slice(0, 5).map(e => ({
          id: Number(e.idEntrega),
          clienteId: Number(e.idCliente),
          desafioId: Number(e.idDesafio),
          estado: this.entregaEstadoTexto(Number(e.estado)),
          fecha: this.fmtDate(e.fechaCreacion),
        }))
      );
    });
  }

  // ======= Helpers =======
  pctAdmins = computed(() => this.safePct(this.usuariosAdmin(), this.usuariosTotal()));
  pctOperarios = computed(() => this.safePct(this.usuariosOperarios(), this.usuariosTotal()));
  pctClientes = computed(() => this.safePct(this.usuariosClientes(), this.usuariosTotal()));

  private safePct(part: number, total: number) {
    if (!total) return 0;
    return (part / total) * 100;
  }

  formatInt(n: number): string {
    return new Intl.NumberFormat('es-AR').format(Math.round(n || 0));
  }

  private getMonthRangeIso(): { desdeMesIso: string; hastaHoyIso: string } {
    const now = new Date();
    const desde = new Date(now.getFullYear(), now.getMonth(), 1);
    // usamos yyyy-MM-dd porque tus filtros suelen usar eso
    const ymd = (d: Date) => d.toISOString().slice(0, 10);
    return { desdeMesIso: ymd(desde), hastaHoyIso: ymd(now) };
  }

  private fmtDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }

  private rolTexto(idRol: number): 'ADMIN'|'OPERARIO'|'CLIENTE' {
    switch (Number(idRol)) {
      case 1: return 'ADMIN';
      case 2: return 'OPERARIO';
      default: return 'CLIENTE';
    }
  }

  private nombreUsuario(u: UsuarioDto): string {
    const ape = String(u.apellidos ?? '').trim();
    const nom = String(u.nombres ?? '').trim();
    const full = [ape, nom].filter(Boolean).join(' ').trim();
    return full || String(u.usuario ?? `Usuario #${u.idUsuario}`);
  }

  private desafioEstadoTexto(estado: number): 'ACTIVO'|'PAUSADO'|'FINALIZADO' {
    switch (Number(estado)) {
      case 1: return 'ACTIVO';
      case 2: return 'PAUSADO';
      case 3: return 'FINALIZADO';
      default: return 'ACTIVO';
    }
  }

  private voucherEstadoTexto(estado: number): 'CREADO'|'ADQUIRIDO'|'UTILIZADO'|'ANULADO' {
    switch (Number(estado)) {
      case 1: return 'CREADO';
      case 2: return 'ADQUIRIDO';
      case 3: return 'UTILIZADO';
      case 4: return 'ANULADO';
      default: return 'ADQUIRIDO';
    }
  }

  private entregaEstadoTexto(estado: number): 'CREADA'|'PENDIENTE'|'VALIDADA'|'RECHAZADA'|'PUNTOS'|'ANULADA' {
    switch (Number(estado)) {
      case 1: return 'CREADA';
      case 2: return 'PENDIENTE';
      case 3: return 'VALIDADA';
      case 4: return 'RECHAZADA';
      case 5: return 'PUNTOS';
      case 6: return 'ANULADA';
      default: return 'PENDIENTE';
    }
  }

  pillClassUsuario(tipo: UsuarioMini['tipo']): string {
    return tipo === 'ADMIN' ? 'pill--admin' : tipo === 'OPERARIO' ? 'pill--op' : 'pill--cli';
  }

  pillClassEntrega(estado: EntregaMini['estado']): string {
    switch (estado) {
      case 'VALIDADA': return 'pill--ok';
      case 'PENDIENTE': return 'pill--warn';
      case 'RECHAZADA': return 'pill--danger';
      case 'ANULADA': return 'pill--danger';
      case 'PUNTOS': return 'pill--ok';
      default: return 'pill--base';
    }
  }
  
  pillClassVoucher(estado: VoucherMini['estado']): string {
    switch (estado) {
      case 'ADQUIRIDO': return 'pill--ok';
      case 'ANULADO': return 'pill--danger';
      case 'UTILIZADO': return 'pill--base';
      case 'CREADO': return 'pill--base';
      default: return 'pill--base';
    }
  }

  get hasData(): boolean {
    return this.usuariosTotal() > 0 || this.desafiosActivos() > 0 || this.vouchersMesAdquiridos() > 0;
  }

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
}
