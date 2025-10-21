// apps/frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
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

// 👇 NUEVO: página puente para la raíz
import { LoginBridgePage } from './pages/login-bridge.page';

export const routes: Routes = [
  // Raíz → bridge silencioso (no redirige a /menu-principal de entrada)
  {
    path: '',
    pathMatch: 'full',
    component: LoginBridgePage,
    canActivate: [authGuard],
  },

  // protegido por sesión + rutas hijas
  {
    path: 'menu-principal',
    component: MenuPrincipalComponent,
    canActivate: [authGuard],
    children: [
      //Home por rol (cliente, admin, operario)
      { path: 'cliente', component: MenuClienteComponent },
      { path: 'admin', component: MenuAdminComponent },
      { path: 'operario', component: MenuOperarioComponent },

      //Perfil
      { path: 'perfil', component: MisDatosComponent },
      { path: 'perfil/editar', component: EditarPerfilComponent },

      //Cliente:
      { path: 'cliente/desafios', component: DesafiosClienteComponent },
      { path: 'cliente/vouchers', component: VouchersClienteComponent },
      { path: 'cliente/biblioteca', component: BibliotecaClienteComponent },
      { path: 'cliente/entregas', component: EntregasClienteComponent },

      //Administrador:
      { path: 'admin/desafios', component: DesafiosAdminComponent },
      { path: 'admin/vouchers', component: VouchersAdminComponent },
      { path: 'admin/biblioteca', component: BibliotecaAdministradorComponent },
      { path: 'admin/usuarios', component: UsuariosAdministradorComponent },
      { path: 'admin/indicadores', component: IndicadoresAdministradorComponent },

      //Operario:
      { path: 'operario/entregas', component: EntregasOperarioComponent },
      { path: 'operario/reportes', component: ReportesOperarioComponent },
    ],
  },

  { path: 'forbidden', component: ForbiddenPage },

  // fallback → raíz (que ya pasa por bridge + guard)
  { path: '**', redirectTo: '' },
];
