import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { hasRoleGuard } from './auth/role.guard';
import { ForbiddenPage } from './pages/forbidden.page';

//Compponentes features

import { MenuPrincipalComponent } from './features/menu-principal/menu-principal.component';
import { MenuClienteComponent } from './features/menu-principal/roles/cliente/menu-cliente.component';
import { DesafiosClienteComponent } from './features/desafios/roles/cliente/desafios-cliente.component';
import { MenuAdminComponent } from './features/menu-principal/roles/administrador/menu-admin.component';
import { MenuOperarioComponent } from './features/menu-principal/roles/operario/menu-operario.component';
import { DesafiosAdministradorComponent } from './features/desafios/roles/administrador/desafios-admin.component';
import { VoucherClienteComponent } from './features/vouchers/roles/cliente/vouchers-cliente.component';
import { ListarVoucherTipoClienteComponent } from './features/vouchers/roles/cliente/listar-voucher-tipo/listar-voucher-tipo-cliente.component.';
import { HistorialMovimientosClienteComponent } from './features/vouchers/roles/cliente/historial-movimientos/historial-movimientos-cliente.component';
import { ListarVoucherClienteComponent } from './features/vouchers/roles/cliente/listar-voucher/listar-voucher-cliente.component';
import { VerVoucherClienteComponent } from './features/vouchers/roles/cliente/ver-voucher/ver-voucher-cliente.component';
import { BibliotecaClienteComponent } from './features/biblioteca/roles/cliente/biblioteca-cliente.component';
import { BibliotecaAdministradorComponent } from './features/biblioteca/roles/administrador/biblioteca-administrador.component';
import { ListarContenidoEducativoComponent } from './features/biblioteca/listar-contenido/listar-contenido-educativo.component';
import { ListarEncuestaComponent } from './features/biblioteca/listar-encuesta/listar-encuesta.component';
import { CrearContenidoEducativoComponent } from './features/biblioteca/roles/administrador/crear-contenido/crear-contenido-educativo.component';
import { CrearEncuestaComponent } from './features/biblioteca/roles/administrador/crear-encuesta/crear-encuesta.component';
import { PreviewContenidoEducativoComponent } from './features/biblioteca/roles/administrador/crear-contenido/preview-contenido-educativo.component';
import { EntregasOperarioComponent } from './features/entregas/roles/operario/entregas-operario.component';
import { EntregasClienteComponent } from './features/entregas/roles/cliente/entregas-cliente.component';
import { EntregasAdministradorComponent } from './features/entregas/roles/administrador/entregas-administrador.component';
import { UsuariosAdministradorComponent } from './features/usuarios/usuarios-administrador.component';
import { IndicadoresAdministradorComponent } from './features/indicadores/indicadores-administrador.component';
import { ReportesOperarioComponent } from './features/reportes/operario/reportes-operario.component';
import { MisDatosComponent } from './features/perfil/mis-datos.component';
import { EditarPerfilComponent } from './features/perfil/editar-perfil.component';
import { LoginBridgePage } from './pages/login-bridge.page';
import { VerContenidoComponent } from './features/biblioteca/ver-contenido/ver-contenido.component';
import { EditarContenidoEducativoComponent } from './features/biblioteca/roles/administrador/editar-contenido/editar-contenido-educativo.component';
import { PreviewEncuestaComponent } from './features/biblioteca/roles/administrador/crear-encuesta/preview-encuesta.component';
import { EditarEncuestaComponent } from './features/biblioteca/roles/administrador/editar-encuesta/editar-encuesta.component';
import { VerEncuestaComponent } from './features/biblioteca/ver-encuesta/ver-encuesta.component';
import { CrearDesafioAdministradorComponent } from './features/desafios/roles/administrador/crear-desafio/crear-desafio-administrador.component';
import { PreviewDesafioAdministradorComponent } from './features/desafios/roles/administrador/crear-desafio/preview-desafio-administrador.component';
import { VerDesafioComponent } from './features/desafios/ver-desafio/ver-desafio.component';
import { EditarDesafioAdministradorComponent } from './features/desafios/roles/administrador/editar-desafio/editar-desafio-administrador.component';
import { ListarDesafiosComponent } from './features/desafios/listar-desafios/listar-desafios.component';
import { MisDesafiosComponent } from './features/desafios/mis-desafios/mis-desafios.component';
import { ListadoDesafiosEntregablesClienteComponent } from './features/entregas/roles/cliente/listado-desafios-entregables/listado-desafios-entregables-cliente.component';
import { ListadoEntregasClienteComponent } from './features/entregas/roles/cliente/listado-entregas-cliente/listado-entregas-cliente.component';
import { CrearVoucherTipoAdministradorComponent } from './features/vouchers/roles/administrador/voucher-tipo/crear-voucher-tipo/crear-voucher-tipo-administrador.component';
import { PreviewVoucherTipoAdministradorComponent } from './features/vouchers/roles/administrador/voucher-tipo/crear-voucher-tipo/preview-voucher-tipo-administrador.component';
import { VerVoucherTipoAdministradorComponent } from './features/vouchers/roles/administrador/voucher-tipo/ver-voucher-tipo/ver-voucher-tipo-administrador.component';
import { AdministradorVouchersComponent } from './features/vouchers/roles/administrador/administrador-voucher-tipo.component';
import { EditarVoucherTipoAdministradorComponent } from './features/vouchers/roles/administrador/voucher-tipo/editar-voucher-tipo/editar-voucher-tipo-administrador.component';
import { ListarVoucherTipoAdministradorComponent } from './features/vouchers/roles/administrador/voucher-tipo/listar-voucher-tipo/listar-voucher-tipo-administrador.component';
import { CrearVoucherAdministradorComponent } from './features/vouchers/roles/administrador/voucher/crear-voucher/crear-voucher-administrador.component';
import { PreviewVoucherAdministradorComponent } from './features/vouchers/roles/administrador/voucher/crear-voucher/preview-voucher-administrador.component';
import { VerVoucherAdministradorComponent } from './features/vouchers/roles/administrador/voucher/ver-voucher/ver-voucher-administrador.component';
import { EditarVoucherAdministradorComponent } from './features/vouchers/roles/administrador/voucher/editar-voucher/editar-voucher-administrador.component';
import { ListarVoucherAdministradorComponent } from './features/vouchers/roles/administrador/voucher/listar-voucher/listar-voucher-administrador.component';
import { ListarEntregasOperarioComponent } from './features/entregas/roles/operario/listar-entregas-operario/listar-entregas-operario.component';
import { ListarNotificacionesComponent } from './features/notificaciones/listar-notificaciones.component';
import { ListarNotificacionesAdminComponent } from './features/notificaciones/admin/listar-notificaciones-admin.component';
import { CrearNotificacionAdminComponent } from './features/notificaciones/admin/crear-notificacion-admin.component';
import { EditarNotificacionAdminComponent } from './features/notificaciones/admin/editar-notificacion-admin.component';

//INVITADO

/*
import { ListarContenidoEducativoInvitadoComponent } from './features/biblioteca/roles/invitado/listar-contenido/listar-contenido-educativo-invitado.component';
import { VerContenidoInvitadoComponent } from './features/biblioteca/roles/invitado/ver-contenido/ver-contenido-invitado.component';
import { ListarEncuestaInvitadoComponent } from './features/biblioteca/roles/invitado/listar-encuesta/listar-encuesta-invitado.component';
import { VerEncuestaInvitadoComponent } from './features/biblioteca/roles/invitado/ver-encuesta/ver-encuesta-invitado.component';
*/
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LoginBridgePage,
    canActivate: [authGuard],
  },

  {
    path: 'menu-principal',
    component: MenuPrincipalComponent,
    canActivate: [authGuard],
    children: [

      //RUTAS ADMINISTRADOR
      {
        path: 'admin',
        component: MenuAdminComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/desafios',
        component: DesafiosAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/notificaciones',
        component: ListarNotificacionesAdminComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/notificaciones/crear',
        component: CrearNotificacionAdminComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/notificaciones/editar/:id',
        component: EditarNotificacionAdminComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/desafios/nuevo',
        component: CrearDesafioAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/desafios/nuevo/preview',
        component: PreviewDesafioAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/desafios/ver/:idDesafio',
        component: VerDesafioComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/desafios/editar/:idDesafio',
        component: EditarDesafioAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/desafios/listado',
        component: ListarDesafiosComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers',
        component: AdministradorVouchersComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher-tipo/crear',
        component: CrearVoucherTipoAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher-tipo/preview',
        component: PreviewVoucherTipoAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher-tipo/ver/:id',
        component: VerVoucherTipoAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher-tipo/editar/:id',
        component: EditarVoucherTipoAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher-tipo/listar',
        component: ListarVoucherTipoAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher/crear',
        component: CrearVoucherAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher/preview',
        component: PreviewVoucherAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher/ver/:id',
        component: VerVoucherAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher/editar/:id',
        component: EditarVoucherAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/vouchers/voucher/listar',
        component: ListarVoucherAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/entregas',
        component: EntregasAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca',
        component: BibliotecaAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/usuarios',
        component: UsuariosAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/indicadores',
        component: IndicadoresAdministradorComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/contenidos/ver/:idContenido',
        component: VerContenidoComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/contenidos/nuevo',
        component: CrearContenidoEducativoComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/contenidos/editar/:idContenido',
        component: EditarContenidoEducativoComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/contenidos/preview',
        component: PreviewContenidoEducativoComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/encuestas/nueva',
        component: CrearEncuestaComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/encuestas/preview',
        component: PreviewEncuestaComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/encuestas/editar/:idEncuesta',
        component: EditarEncuestaComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      {
        path: 'admin/biblioteca/encuestas/ver/:idEncuesta',
        component: VerEncuestaComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['ADMIN', 'ADMINISTRADOR'] },
      },

      //-------------------------------------------------------------------------------------//

      //RUTAS CLIENTE
      { path: 'cliente', component: MenuClienteComponent },
      { path: 'cliente/desafios', component: DesafiosClienteComponent },
      { path: 'cliente/vouchers', component: VoucherClienteComponent },
      { path: 'cliente/biblioteca', component: BibliotecaClienteComponent },
      { path: 'cliente/entregas', component: EntregasClienteComponent },

      {
        path: 'cliente/biblioteca/contenidos/ver/:idContenido',
        component: VerContenidoComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/biblioteca/encuestas/ver/:idEncuesta',
        component: VerEncuestaComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/biblioteca/contenidos/lista',
        component: ListarContenidoEducativoComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/biblioteca/encuestas/lista',
        component: ListarEncuestaComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/desafios/mis-desafios',
        component: MisDesafiosComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/desafios/listado',
        component: ListarDesafiosComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },
      
      {
        path: 'cliente/desafios/ver/:idDesafio',
        component: VerDesafioComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/entregas/desafios-entregables',
        component: ListadoDesafiosEntregablesClienteComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/entregas/listado',
        component: ListadoEntregasClienteComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/vouchers/disponibles',
        component: ListarVoucherTipoClienteComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/vouchers/mis-vouchers',
        component: ListarVoucherClienteComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/vouchers/ver/:id',
        component: VerVoucherClienteComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      {
        path: 'cliente/vouchers/historial-movimientos',
        component: HistorialMovimientosClienteComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['CLIENTE'] },
      },

      //-------------------------------------------------------------------------------------//

      //RUTAS OPERARIO
      { path: 'operario', component: MenuOperarioComponent },
      { path: 'operario/entregas', component: EntregasOperarioComponent },
      { path: 'operario/reportes', component: ReportesOperarioComponent },

      {
        path: 'operario/entregas/listado',
        component: ListarEntregasOperarioComponent,
        canActivate: [hasRoleGuard],
        data: { roles: ['OPERARIO'] },
      },

      //-------------------------------------------------------------------------------------//

      //RUTAS COMPARTIDAS
      { path: 'perfil', component: MisDatosComponent },
      { path: 'perfil/editar', component: EditarPerfilComponent },

      //NOTIFICACIONES
      { path: 'notificaciones', component: ListarNotificacionesComponent},

      // LISTADOS COMPARTIDOS (cliente y admin)
      {
        path: 'biblioteca/contenidos',
        component: ListarContenidoEducativoComponent,
      },

      {
        path: 'biblioteca/encuestas',
        component: ListarEncuestaComponent,
      },

      // CLIENTE/ADMIN: ver contenido
      {
        path: 'biblioteca/contenidos/ver/:idContenido',
        component: VerContenidoComponent,
      },

      // CLIENTE/ADMIN: ver encuesta (pública)
      {
        path: 'biblioteca/encuestas/ver/:idEncuesta',
        component: VerEncuestaComponent,
      },
    ],
  },

  //-------------------------------------------------------------------------------------//
  //RUTAS INVITADO (PUBLICAS)
  {
    path: 'invitado/biblioteca',
    component: BibliotecaClienteComponent,
    data: { public: true },
  },

  {
    path: 'invitado/biblioteca/contenidos',
    component: ListarContenidoEducativoComponent,
    data: { public: true },
  },

  {
    path: 'invitado/biblioteca/encuestas',
    component: ListarEncuestaComponent,
    data: { public: true },
  },

  {
    path: 'invitado/biblioteca/contenidos/ver/:idContenido',
    component: VerContenidoComponent,
    data: { public: true },
  },

  {
    path: 'invitado/biblioteca/encuestas/ver/:idEncuesta',
    component: VerEncuestaComponent,
    data: { public: true },
  },

  // Recurso educativo publico
  { 
    path: 'public/recursos/:idContenido', 
    component: VerContenidoComponent, 
    data: { public: true},
  },

  { path: 'forbidden', component: ForbiddenPage },
  { path: '**', redirectTo: '' },
];