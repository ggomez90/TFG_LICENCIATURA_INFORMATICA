import { Component, OnInit, computed, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioCreateDialogComponent } from './create/usuario-create-dialog.component';
import { UsuariosApi, UsuarioDto, PaginatedResponse, UpdateUsuarioDto } from '../../api/usuarios.api';
import { UsuarioViewDialogComponent } from './view/usuario-view-dialog.component';
import { UsuarioEditDialogComponent } from './edit/usuario-edit-dialog.component';
import { UsuarioBanDialogComponent } from './ban/usuario-ban-dialog.component';

type Rol = 'admin' | 'operario' | 'cliente';
type FiltroRol = 'todos' | Rol;
type FiltroEstado = 'todos' | 'activos' | 'baneados';
type FiltroClienteSubtipo = 'todos' | 'pendiente' | '1' | '2' | '3';

interface UsuarioVM {
  id: number;
  nombreUsuario: string;
  propietario: string;
  dniCuitCuil: string;
  email: string;
  tipo: Rol;
  estadoId: 1 | 2 | 3; // 1=PEND,2=HAB,3=BAN
  isBanned: boolean;
  motivoBan?: string | null;
  idTipoCliente?: 1 | 2 | 3 | null;
}

@Component({
  selector: 'app-usuarios-administrador',
  standalone: true,
  imports: [
    CommonModule,
    UsuarioCreateDialogComponent,
    UsuarioViewDialogComponent,
    UsuarioEditDialogComponent,
    UsuarioBanDialogComponent,
  ],
  templateUrl: './usuarios-administrador.component.html',
  styleUrls: ['./usuarios-administrador.component.scss'],
})
export class UsuariosAdministradorComponent implements OnInit {
  private api = inject(UsuariosApi);
  private host = inject(ElementRef<HTMLElement>);

  // Config
  readonly pageSize = 50;

  // Estado base
  all = signal<UsuarioVM[]>([]);
  page = signal<number>(1);
  q = signal<string>('');
  filtroRol = signal<FiltroRol>('todos');
  filtroEstado = signal<FiltroEstado>('todos');
  filtroClienteSubtipo = signal<FiltroClienteSubtipo>('todos');

  // UI: custom dropdown
  menuOpen = signal<boolean>(false);
  submenuOpen = signal<boolean>(false);

  // Loader / errores
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  // Paginación modo servidor
  serverPaging = signal<boolean>(false);
  serverItems = signal<UsuarioVM[]>([]);
  serverTotal = signal<number>(0);

  // Contadores
  counters = signal({
    total: 0,
    activos: 0,
    baneados: 0,
    pendientes: 0,
    clientes: 0,
    operarios: 0,
    admins: 0,
  });

  // Modales
  showCreate = signal<boolean>(false);
  showView = signal<boolean>(false);
  showEdit = signal<boolean>(false);
  showBan = signal<boolean>(false);
  current = signal<UsuarioVM | null>(null);

  ngOnInit(): void {
    this.loadCounters();
    this.loadPage(1);
  }

  // Cerrar menús al click afuera
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const root = this.host.nativeElement;
    if (!root.contains(ev.target as Node)) {
      this.closeMenus();
    }
  }

  // UI handlers
  private isFiltroRol(v: string): v is FiltroRol {
    return v === 'todos' || v === 'admin' || v === 'operario' || v === 'cliente';
  }
  private isFiltroEstado(v: string): v is FiltroEstado {
    return v === 'todos' || v === 'activos' || v === 'baneados';
  }

  onBuscar(value: string) {
    this.q.set(value.trim().toLowerCase());
    this.goTo(1);
    this.refresh();
  }

  onRolChange(value: string) {
    if (this.isFiltroRol(value)) {
      this.filtroRol.set(value as FiltroRol);
      if (value !== 'cliente') this.filtroClienteSubtipo.set('todos');
      this.goTo(1);
      this.refresh();
    }
  }

  // selección combinada desde el dropdown custom
  selectTipoCombined(v: string) {
    this.onTipoCombinedChange(v);
    this.closeMenus();
  }

  // Label para botón tipo
  labelTipoCombined(): string {
    const rol = this.filtroRol();
    if (rol === 'todos') return 'Todos';
    if (rol === 'operario') return 'Operario';
    if (rol === 'admin') return 'Administrador';
    const sub = this.filtroClienteSubtipo();
    const map: Record<FiltroClienteSubtipo, string> = {
      'todos': 'Cliente — Todos',
      'pendiente': 'Cliente — Pendiente',
      '1': 'Cliente — Ciudadano',
      '2': 'Cliente — PYME/Empresa',
      '3': 'Cliente — Institución',
    };
    return map[sub] ?? 'Cliente';
  }

  toggleMenu() {
    const next = !this.menuOpen();
    this.menuOpen.set(next);
    if (!next) this.submenuOpen.set(false);
  }
  closeMenus() {
    this.menuOpen.set(false);
    this.submenuOpen.set(false);
  }
  openSubOnHover() { this.submenuOpen.set(true); }
  closeSubOnHover() { this.submenuOpen.set(false); }
  toggleSubmenu(ev: MouseEvent) {
    ev.stopPropagation();
    this.submenuOpen.set(!this.submenuOpen());
  }

  onClienteSubtipoChange(value: string) {
    const v = (value as FiltroClienteSubtipo) || 'todos';
    this.filtroClienteSubtipo.set(v);
    this.goTo(1);
    this.refresh();
  }

  onEstadoChange(value: string) {
    if (this.isFiltroEstado(value)) {
      this.filtroEstado.set(value);
      this.goTo(1);
      this.refresh();
    }
  }

  // Modales
  onNuevaCuenta() { this.showCreate.set(true); }
  onCreateClosed() { this.showCreate.set(false); }
  onCreateSaved() {
    this.showCreate.set(false);
    this.refreshAll();
  }

  verUsuario(u: UsuarioVM) {
    this.current.set(u);
    this.showView.set(true);
  }
  onViewClosed() { this.showView.set(false); this.current.set(null); }

  editarUsuario(u: UsuarioVM) {
    this.current.set(u);
    this.showEdit.set(true);
  }
  onEditClosed() { this.showEdit.set(false); this.current.set(null); }
  onEditSaved() {
    this.showEdit.set(false);
    this.current.set(null);
    this.refreshAll();
  }

  // Ban / Habilitar
  async toggleBan(u: UsuarioVM, ev?: Event) {
    const checked = (ev?.target as HTMLInputElement | null)?.checked;
    if (u.isBanned && (checked === undefined || checked === false)) {
      this.loading.set(true);
      this.api.enable(u.id, { idEstadoUsuario: 2 }).subscribe({
        next: () => { this.loading.set(false); this.refreshAll(); },
        error: (e) => { this.loading.set(false); alert(e?.message || 'Error al habilitar'); }
      });
      return;
    }
    if (!u.isBanned && (checked === undefined || checked === true)) {
      this.current.set(u);
      this.showBan.set(true);
      return;
    }
  }

  onBanClosed() { this.showBan.set(false); this.current.set(null); }
  onBanConfirmed() {
    this.showBan.set(false);
    this.current.set(null);
    this.refreshAll();
  }

  // Mapeos y filtros
  private warnedMissingTipoCliente = false;

  private mapDb(u: UsuarioDto): UsuarioVM {
    const tipo: Rol = u.idRolUsuario === 1 ? 'admin' : (u.idRolUsuario === 2 ? 'operario' : 'cliente');
    const nombre = [u.nombres ?? '', u.apellidos ?? ''].join(' ').trim();
    const propietario = nombre || u.usuario || u.email || `#${u.idUsuario}`;
    const estadoId = (u.idEstadoUsuario as 1|2|3) ?? 2;

    // TOMAR idTipoCliente
    const fromJoin = (u as any)?.cliente?.idTipoCliente;
    const rawTipoCliente = fromJoin !== undefined ? fromJoin : (u as any)?.idTipoCliente;

    const idTipoCliente: 1|2|3|null|undefined =
      rawTipoCliente === undefined ? undefined :
      rawTipoCliente === null ? null :
      Number(rawTipoCliente) as 1|2|3;

    if (tipo === 'cliente' && idTipoCliente === undefined && !this.warnedMissingTipoCliente) {
      console.warn('[Usuarios] El DTO no incluye idTipoCliente; el filtro de subtipo funciona solo si el backend lo envía o implementás el filtro server-side.');
      this.warnedMissingTipoCliente = true;
    }

    return {
      id: u.idUsuario,
      nombreUsuario: u.usuario,
      propietario,
      dniCuitCuil: u.dniCuitCuil ?? '',
      email: u.email,
      tipo,
      estadoId,
      isBanned: estadoId === 3,
      motivoBan: (u as any)?.motivoBan ?? null,
      idTipoCliente,
    };
  }

  filtered = computed(() => {
    const term = this.q();
    const rol = this.filtroRol();
    const est = this.filtroEstado();
    const sub = this.filtroClienteSubtipo();
    const base = this.serverPaging() ? this.serverItems() : this.all();

    return base.filter(u => {
      // Estado
      const matchesEstado =
        est === 'todos' ? true :
        est === 'activos' ? !u.isBanned :
        u.isBanned;
      if (!matchesEstado) return false;

      // Rol
      const matchesRol = rol === 'todos' ? true : u.tipo === rol;
      if (!matchesRol) return false;

      // Subtipo cliente
      if (rol === 'cliente' && sub !== 'todos') {
        if (u.idTipoCliente === undefined) {
          return false;
        }
        if (sub === 'pendiente') {
          if (u.idTipoCliente !== null) return false;
        } else {
          const wanted = Number(sub) as 1|2|3;
          if (u.idTipoCliente !== wanted) return false;
        }
      }

      // Búsqueda
      if (!term) return true;
      const blob = `${u.id} ${u.nombreUsuario} ${u.propietario} ${u.dniCuitCuil} ${u.email} ${u.tipo}`.toLowerCase();
      return blob.includes(term);
    });
  });

  pages = computed(() => {
    const total = this.serverPaging() ? this.serverTotal() : this.filtered().length;
    const n = Math.ceil(total / this.pageSize);
    return n > 0 ? n : 1;
  });

  visible = computed(() => {
    if (this.serverPaging()) return this.filtered();
    const p = this.page();
    const start = (p - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  canPrev = computed(() => this.page() > 1);

  canNext = computed(() => {
    if (this.serverPaging()) {
      const total = this.serverTotal();
      const currentEnd = this.page() * this.pageSize;
      return total > currentEnd;
    }
    return this.page() < this.pages();
  });

  goPrev() {
    if (this.canPrev()) this.goTo(this.page() - 1);
  }
  goNext() {
    if (this.canNext()) this.goTo(this.page() + 1);
  }

  goTo(p: number) {
    const max = this.pages();
    const target = Math.min(Math.max(1, p), max);
    this.page.set(target);
    if (this.serverPaging()) this.loadPage(target);
  }

  // Carga
  private makeServerQuery(page: number) {
    // page y pageSize
    const query: any = {
      page,
      pageSize: this.pageSize,
    };

    // Rol y subfiltro (para ver a que endpoint va a ir el servicio)
    const rol = this.filtroRol();
    if (rol !== 'todos') {
      query.tipo = rol; // cliente, operario o admin
    }

    if (rol === 'cliente') {
      const sub = this.filtroClienteSubtipo();
      if (sub !== 'todos') {
        // 1/2/3 como número y pendiente como string para NULL
        query.tipoCliente = (sub === 'pendiente') ? 'pendiente' : Number(sub);
      }
    }

    query.sortBy = 'idUsuario' as const;
    query.order = 'desc' as const;

    return query;
  }

  private loadPage(page: number) {
    this.loading.set(true);
    this.errorMsg.set(null);
    const query = this.makeServerQuery(page);

    (this.api as any).queryAdmin(query).subscribe({
      next: (resp: any) => {
        if (isPaginated<UsuarioDto>(resp)) {
          const mapped = resp.items.map((u: UsuarioDto) => this.mapDb(u));
          this.serverPaging.set(true);
          this.serverItems.set(mapped);
          this.serverTotal.set(resp.total);
          this.page.set(page);
        } else {
          const arr = (resp as UsuarioDto[]).map(u => this.mapDb(u));
          this.serverPaging.set(false);
          this.all.set(arr);
          this.page.set(1);
        }
        this.loading.set(false);
      },
      error: (e: any) => {
        this.loading.set(false);
        this.errorMsg.set(e?.message || 'Error al cargar usuarios');
      },
    });
  }

  private refresh() {
    //if (this.serverPaging()) this.loadPage(this.page());
    this.loadPage(this.page());
  }

  private loadCounters() {
    (this.api as any).fetchAllForCounters().subscribe({
      next: (rows: UsuarioDto[]) => {
        const total = rows.length;

        let admins = 0, operarios = 0, clientes = 0;
        let activos = 0, baneados = 0, pendientes = 0;

        rows.forEach(r => {
          if (r.idRolUsuario === 1) admins++;
          else if (r.idRolUsuario === 2) operarios++;
          else clientes++;

          if (r.idEstadoUsuario === 2) activos++;
          else if (r.idEstadoUsuario === 3) baneados++;
          else if (r.idEstadoUsuario === 1) pendientes++;
        });

        this.counters.set({ total, activos, baneados, pendientes, clientes, operarios, admins });
      },
      error: () => this.counters.set({
        total: 0, activos: 0, baneados: 0, pendientes: 0, clientes: 0, operarios: 0, admins: 0
      }),
    });
  }

  // Refrescar grilla + contadores
  private refreshAll() {
    this.loadPage(this.page());
    this.loadCounters();
  }

  trackById(index: number, item: UsuarioVM): number { return item.id; }

  tipoCombinedValue(): string {
    const rol = this.filtroRol();
    if (rol !== 'cliente') return rol; // todos - operario - admin
    const sub = this.filtroClienteSubtipo();
    return `cliente:${sub}`;
  }

  // Cambios del valor combinado
  onTipoCombinedChange(v: string) {
    if (v === 'todos' || v === 'operario' || v === 'admin') {
      this.filtroRol.set(v as any);
      this.filtroClienteSubtipo.set('todos');
    } else if (v.startsWith('cliente:')) {
      const sub = (v.split(':')[1] ?? 'todos') as FiltroClienteSubtipo;
      this.filtroRol.set('cliente');
      if (sub === 'todos' || sub === 'pendiente' || sub === '1' || sub === '2' || sub === '3') {
        this.filtroClienteSubtipo.set(sub);
      } else {
        this.filtroClienteSubtipo.set('todos');
      }
    } else {
      this.filtroRol.set('todos');
      this.filtroClienteSubtipo.set('todos');
    }
    this.goTo(1);
    this.refresh();
  }
}

function isPaginated<T>(x: any): x is PaginatedResponse<T> {
  return x && Array.isArray(x.items) && typeof x.total === 'number';
}
