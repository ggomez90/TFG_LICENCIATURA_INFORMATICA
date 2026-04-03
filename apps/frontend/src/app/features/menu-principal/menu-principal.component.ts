import { Component, HostListener, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { keycloak } from '../../auth/keycloak';
import { RolesService } from '../../auth/roles.service';
import { NotificacionApi, NotificacionItem } from '../../api/notificacion.api';
import { UsuarioNotificacionMetaApi } from '../../api/usuario-notificacion-meta.api';

import { MenuClienteComponent } from './roles/cliente/menu-cliente.component';
import { MenuOperarioComponent } from './roles/operario/menu-operario.component';
import { MenuAdminComponent } from './roles/administrador/menu-admin.component';

type KCParsed = {
  given_name?: string;
  family_name?: string;
  name?: string;
  preferred_username?: string;
} & Record<string, unknown>;

type MenuItem = { label: string; path: string };

@Component({
  selector: 'app-menu-principal',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MenuClienteComponent,
    MenuOperarioComponent,
    MenuAdminComponent,
  ],
  templateUrl: './menu-principal.component.html',
  styleUrls: ['./menu-principal.component.scss'],
})
export class MenuPrincipalComponent implements OnInit {
  private readonly notificacionApi = inject(NotificacionApi);
  private readonly usuarioNotificacionMetaApi = inject(UsuarioNotificacionMetaApi);

  kc = keycloak;
  profileOpen = signal(false);
  mobileOpen = signal(false);
  bellOpen = signal(false);

  notifCount = signal<number>(0);
  hayNovedades = signal(false);
  cargandoNotificaciones = signal(false);
  notificaciones = signal<NotificacionItem[]>([]);

  constructor(private roles: RolesService, private router: Router) {}

  ngOnInit(): void {
    this.cargarEstadoCampanita();
    this.cargarUltimasNotificaciones();
  }

  // Home solo /menu-principal sin hijos
  isHome(): boolean {
    const path = this.router.url.split('#')[0].split('?')[0];
    return path === '/menu-principal' || path === '/menu-principal/';
  }

  // Flags por rol
  isAdmin = computed(() => this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']));
  isOperario = computed(() => this.roles.hasRole('OPERARIO'));
  isCliente = computed(() => this.roles.hasRole('CLIENTE'));

  // Menú central (tabs) según rol
  centerMenu(): MenuItem[] {
    if (this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR'])) {
      return [
        { label: 'INICIO', path: '/menu-principal' },
        { label: 'USUARIOS', path: '/menu-principal/admin/usuarios' },
        { label: 'BIBLIOTECA EDUCATIVA', path: '/menu-principal/admin/biblioteca' },
        { label: 'DESAFÍOS', path: '/menu-principal/admin/desafios' },
        { label: 'ENTREGAS', path: '/menu-principal/admin/entregas' },
        { label: 'VOUCHERS', path: '/menu-principal/admin/vouchers' },
        { label: 'INDICADORES', path: '/menu-principal/admin/indicadores' },
      ];
    }
    if (this.roles.hasRole('OPERARIO')) {
      return [
        { label: 'INICIO', path: '/menu-principal' },
        { label: 'ENTREGAS', path: '/menu-principal/operario/entregas' },
        { label: 'REPORTES', path: '/menu-principal/operario/reportes' },
      ];
    }
    if (this.roles.hasRole('CLIENTE')) {
      return [
        { label: 'INICIO', path: '/menu-principal' },
        { label: 'BIBLIOTECA EDUCATIVA', path: '/menu-principal/cliente/biblioteca' },
        { label: 'DESAFÍOS', path: '/menu-principal/cliente/desafios' },
        { label: 'VOUCHERS', path: '/menu-principal/cliente/vouchers' },
        { label: 'MIS ENTREGAS', path: '/menu-principal/cliente/entregas' },
      ];
    }
    return [];
  }

  apellidoNombre(): string {
    const t = this.kc.tokenParsed as KCParsed | undefined;
    const nombre = (t?.given_name ?? '').trim();
    const apellido = (t?.family_name ?? '').trim();
    const full = (apellido || nombre)
      ? `${apellido} ${nombre}`.trim()
      : (t?.name || t?.preferred_username || 'Usuario');
    return full.toUpperCase();
  }

  iniciales(): string {
    const t = this.kc.tokenParsed as KCParsed | undefined;
    const nombre = (t?.given_name ?? '').trim();
    const apellido = (t?.family_name ?? '').trim();
    const base = (apellido || nombre)
      ? `${apellido} ${nombre}`.trim()
      : (t?.name || t?.preferred_username || 'Usuario');
    const letters = base
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase() ?? '')
      .join('');
    return letters || 'U';
  }

  // Perfil
  toggleProfile() { this.profileOpen.update(v => !v); }
  closeProfile() { this.profileOpen.set(false); }

  // Menú móvil
  toggleMobile() { this.mobileOpen.update(v => !v); }
  closeMobile() { this.mobileOpen.set(false); }
  onNavigateMobile() {
    this.closeMobile();
    this.closeProfile();
    this.closeBell();
  }

  logout() {
    this.kc.logout({ redirectUri: window.location.origin });
  }

  onBellClick() {
    this.profileOpen.set(false);

    if (this.isAdmin()) {
      this.closeBell();
      this.router.navigate(['/menu-principal/admin/notificaciones']);
      return;
    }

    const next = !this.bellOpen();
    this.bellOpen.set(next);

    if (next) {
      this.marcarCampanitaVista();
      this.cargarUltimasNotificaciones();
    }
  }

  closeBell() {
    this.bellOpen.set(false);
  }

  verTodasNotificaciones() {
    this.closeBell();

    if (this.isAdmin()) {
      this.router.navigate(['/menu-principal/admin/notificaciones']);
      return;
    }

    this.router.navigate(['/menu-principal/notificaciones']);
  }

  trackByNotif(_: number, item: NotificacionItem): number {
    return item.idNotificacion;
  }

  private cargarEstadoCampanita() {
    if (!this.isOperario() && !this.isCliente()) {
      this.hayNovedades.set(false);
      this.notifCount.set(0);
      return;
    }

    this.usuarioNotificacionMetaApi.getEstado().subscribe({
      next: (resp) => {
        this.hayNovedades.set(resp.hayNovedades);
        this.notifCount.set(resp.cantidadNuevas ?? 0);
      },
      error: (err) => {
        console.error('[MenuPrincipal] Error cargando estado de notificaciones', err);
        this.hayNovedades.set(false);
        this.notifCount.set(0);
      },
    });
  }

  private cargarUltimasNotificaciones() {
    if (!this.isOperario() && !this.isCliente()) {
      this.notificaciones.set([]);
      return;
    }

    this.cargandoNotificaciones.set(true);

    this.notificacionApi.getMias({
      limit: 5,
      offset: 0,
    }).subscribe({
      next: (resp) => {
        this.notificaciones.set(resp.items ?? []);
        this.cargandoNotificaciones.set(false);
      },
      error: (err) => {
        console.error('[MenuPrincipal] Error cargando últimas notificaciones', err);
        this.notificaciones.set([]);
        this.cargandoNotificaciones.set(false);
      },
    });
  }

  private marcarCampanitaVista() {
    if (!this.isOperario() && !this.isCliente()) return;

    this.usuarioNotificacionMetaApi.marcarVista().subscribe({
      next: () => {
        this.hayNovedades.set(false);
        this.notifCount.set(0);
      },
      error: (err) => {
        console.error('[MenuPrincipal] Error marcando campanita como vista', err);
      },
    });
  }

  // Cerrar dropdowns al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;

    if (!target.closest('.profile')) this.profileOpen.set(false);

    if (!target.closest('.hamburger') && !target.closest('.mobile-menu')) {
      this.mobileOpen.set(false);
    }

    if (!target.closest('.bell-wrap')) {
      this.bellOpen.set(false);
    }
  }

  // Cerrar en ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    this.profileOpen.set(false);
    this.mobileOpen.set(false);
    this.bellOpen.set(false);
  }

  public currentYear = new Date().getFullYear();
}