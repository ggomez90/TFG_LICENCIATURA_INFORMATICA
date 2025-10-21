// apps/frontend/src/app/features/menu-principal/menu-principal.component.ts
import { Component, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { keycloak } from '../../auth/keycloak';
import { RolesService } from '../../auth/roles.service';

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
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet,
            MenuClienteComponent, MenuOperarioComponent, MenuAdminComponent],
  templateUrl: './menu-principal.component.html',
  styleUrls: ['./menu-principal.component.scss'],
})
export class MenuPrincipalComponent {
  kc = keycloak;
  profileOpen = signal(false);
  mobileOpen  = signal(false);   // << nuevo: estado del menú móvil
  notifCount  = signal<number>(0);

  constructor(private roles: RolesService, private router: Router) {}

  /** Home exacto: solo /menu-principal (sin hijos) */
  isHome(): boolean {
    const path = this.router.url.split('#')[0].split('?')[0];
    return path === '/menu-principal' || path === '/menu-principal/';
  }

  // Flags por rol (por si querés condicionar algo)
  isAdmin    = computed(() => this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']));
  isOperario = computed(() => this.roles.hasRole('OPERARIO'));
  isCliente  = computed(() => this.roles.hasRole('CLIENTE'));

  // Menú central (tabs) según rol
  centerMenu(): MenuItem[] {
    if (this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR'])) {
      return [
        { label: 'INICIO', path: '/menu-principal' },
        { label: 'USUARIOS',        path: '/menu-principal/admin/usuarios' },
        { label: 'BIBLIOTECA EDUCATIVA', path: '/menu-principal/admin/biblioteca' },
        { label: 'DESAFÍOS',             path: '/menu-principal/admin/desafios' },
        { label: 'VOUCHERS',             path: '/menu-principal/admin/vouchers' },
        { label: 'INDICADORES',     path: '/menu-principal/admin/indicadores' },
      ];
    }
    if (this.roles.hasRole('OPERARIO')) {
      return [
        { label: 'INICIO',      path: '/menu-principal' },
        { label: 'ENTREGAS',    path: '/menu-principal/operario/entregas' },
        { label: 'REPORTES',    path: '/menu-principal/operario/reportes' },
      ];
    }
    if (this.roles.hasRole('CLIENTE')) {
      return [
        { label: 'INICIO', path: '/menu-principal' },
        { label: 'BIBLIOTECA EDUCATIVA', path: '/menu-principal/cliente/biblioteca' },
        { label: 'DESAFÍOS',             path: '/menu-principal/cliente/desafios' },
        { label: 'VOUCHERS',             path: '/menu-principal/cliente/vouchers' },
        { label: 'MIS ENTREGAS',         path: '/menu-principal/cliente/entregas' },
      ];
    }
    return [];
  }

  apellidoNombre(): string {
    const t = this.kc.tokenParsed as KCParsed | undefined;
    const nombre   = (t?.given_name ?? '').trim();
    const apellido = (t?.family_name ?? '').trim();
    const full = (apellido || nombre)
      ? `${apellido} ${nombre}`.trim()
      : (t?.name || t?.preferred_username || 'Usuario');
    return full.toUpperCase();
  }

  iniciales(): string {
    const t = this.kc.tokenParsed as KCParsed | undefined;
    const nombre   = (t?.given_name ?? '').trim();
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
  closeProfile()  { this.profileOpen.set(false); }

  // Menú móvil
  toggleMobile()  { this.mobileOpen.update(v => !v); }
  closeMobile()   { this.mobileOpen.set(false); }
  onNavigateMobile() { this.closeMobile(); this.closeProfile(); }

  logout() {
    this.kc.logout({ redirectUri: window.location.origin });
  }

  onBellClick() {
    // hook para notificaciones
  }

  // Cerrar dropdowns al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    // fuera del bloque perfil
    if (!target.closest('.profile')) this.profileOpen.set(false);
    // fuera del menú móvil (icono y panel)
    if (!target.closest('.hamburger') && !target.closest('.mobile-menu')) {
      this.mobileOpen.set(false);
    }
  }

  // Cerrar en ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    this.profileOpen.set(false);
    this.mobileOpen.set(false);
  }

  public currentYear = new Date().getFullYear();
}
