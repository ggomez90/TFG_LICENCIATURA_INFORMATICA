// apps/frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { hasRoleGuard } from './auth/role.guard'; // 👈 nuevo guard para roles

import { MenuPrincipalComponent } from './features/menu-principal/menu-principal.component';
import { ForbiddenPage } from './pages/forbidden.page';

// Home del cliente
import { MenuClienteComponent } from './features/menu-principal/roles/cliente/menu-cliente.component';
// Desafíos (cliente)
import { DesafiosClienteComponent } from './features/desafios/roles/cliente/desafios-cliente.component';

// Home del administrador
import { MenuAdminComponent } from './features/menu-principal/roles/administrador/menu-admin.component';
import { MenuOperarioComponent } from './features/menu-principal/roles/operario/menu-operario.component';
// Desafíos (administrador)
import { DesafiosAdminComponent } from './features/desafios/roles/administrador/desafios-admin.component';

import { VouchersClienteComponent } from './features/vouchers/roles/cliente/vouchers-cliente.component';
import { VouchersAdminComponent } from './features/vouchers/roles/administrador/vouchers-admin.component';
import { BibliotecaClienteComponent } from './features/biblioteca/roles/cliente/biblioteca-cliente.component';
import { BibliotecaAdministradorComponent } from './features/biblioteca/roles/administrador/biblioteca-administrador.component';
import { EntregasOperarioComponent } from './features/entregas/roles/operario/entregas-operario.component';
import { EntregasClienteComponent } from './features/entregas/roles/cliente/entregas-cliente.component';
import { UsuariosAdministradorComponent } from './features/usuarios/usuarios-administrador.component';
import { IndicadoresAdministradorComponent } from './features/indicadores/indicadores-administrador.component';
import { ReportesOperarioComponent } from './features/reportes/reportes-operario.component';
import { MisDatosComponent } from './features/perfil/mis-datos.component';
import { EditarPerfilComponent } from './features/perfil/editar-perfil.component';

// 👇 Página puente para login inicial
import { LoginBridgePage } from './pages/login-bridge.page';

export const routes: Routes = [
  // Ruta raíz → bridge que decide adónde redirigir según rol
  {
    path: '',
    pathMatch: 'full',
    component: LoginBridgePage,
    canActivate: [authGuard],
  },

  // Área protegida con sesión activa
  {
    path: 'menu-principal',
    component: MenuPrincipalComponent,
    canActivate: [authGuard],
    children: [
      // ==== HOME POR ROL ====
      { path: 'cliente', component: MenuClienteComponent },
      { path: 'operario', component: MenuOperarioComponent },

      // ADMIN: protegemos con roles específicos
      { path: 'admin', component: MenuAdminComponent, canActivate: [hasRoleGuard], data: { roles: ['ADMIN', 'ADMINISTRADOR'] } },

      // ==== PERFIL ====
      { path: 'perfil', component: MisDatosComponent },
      { path: 'perfil/editar', component: EditarPerfilComponent },

      // ==== CLIENTE ====
      { path: 'cliente/desafios', component: DesafiosClienteComponent },
      { path: 'cliente/vouchers', component: VouchersClienteComponent },
      { path: 'cliente/biblioteca', component: BibliotecaClienteComponent },
      { path: 'cliente/entregas', component: EntregasClienteComponent },

      // ==== ADMINISTRADOR (todas protegidas por roles) ====
      { path: 'admin/desafios', component: DesafiosAdminComponent, canActivate: [hasRoleGuard], data: { roles: ['ADMIN', 'ADMINISTRADOR'] } },
      { path: 'admin/vouchers', component: VouchersAdminComponent, canActivate: [hasRoleGuard], data: { roles: ['ADMIN', 'ADMINISTRADOR'] } },
      { path: 'admin/biblioteca', component: BibliotecaAdministradorComponent, canActivate: [hasRoleGuard], data: { roles: ['ADMIN', 'ADMINISTRADOR'] } },
      { path: 'admin/usuarios', component: UsuariosAdministradorComponent, canActivate: [hasRoleGuard], data: { roles: ['ADMIN', 'ADMINISTRADOR'] } },
      { path: 'admin/indicadores', component: IndicadoresAdministradorComponent, canActivate: [hasRoleGuard], data: { roles: ['ADMIN', 'ADMINISTRADOR'] } },

      // ==== OPERARIO ====
      { path: 'operario/entregas', component: EntregasOperarioComponent },
      { path: 'operario/reportes', component: ReportesOperarioComponent },
    ],
  },

  // Página de acceso denegado
  { path: 'forbidden', component: ForbiddenPage },

  // Cualquier otra ruta → raíz (pasa por bridge + guard)
  { path: '**', redirectTo: '' },
];
