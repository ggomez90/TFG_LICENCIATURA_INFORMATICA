import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type QuickLink = {
  title: string;
  desc: string;
  route: string;
  iconPath: string;
};

type UsuarioMini = { id: number; nombre: string; tipo: 'ADMIN'|'OPERARIO'|'CLIENTE'; email: string; };
type EntregaMini = { id: number; cliente: string; desafio: string; estado: 'PENDIENTE'|'VALIDADA'|'RECHAZADA'; fecha: string; };

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-admin.component.html',
  styleUrls: ['./menu-admin.component.scss'],
})
export class MenuAdminComponent {
  // --- Datos ficticios de resumen ---
  usuariosTotal = signal(128);
  usuariosAdmin = signal(8);
  usuariosOperarios = signal(6);
  usuariosClientes = computed(() => this.usuariosTotal() - this.usuariosAdmin() - this.usuariosOperarios());

  desafiosActivos = signal(12);
  vouchersEntregados = signal(86);
  entregasPendientes = signal(4);

  // Porcentajes precalculados (evitamos usar Math en el template)
  pctAdmins = computed(() => this.safePct(this.usuariosAdmin(), this.usuariosTotal()));
  pctOperarios = computed(() => this.safePct(this.usuariosOperarios(), this.usuariosTotal()));
  pctClientes = computed(() => this.safePct(this.usuariosClientes(), this.usuariosTotal()));

  private safePct(part: number, total: number) {
    if (!total) return 0;
    return (part / total) * 100;
  }

  // --- Accesos rápidos (routerLink de ejemplo, ajusta a tus rutas reales) ---
  links = signal<QuickLink[]>([
    { title: 'Usuarios', desc: 'Altas, bajas, edición y búsqueda', route: '/admin/usuarios', iconPath: 'M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z' },
    { title: 'Operarios', desc: 'Gestión del personal de validación', route: '/admin/operarios', iconPath: 'M12 2a5 5 0 0 0-5 5v2h10V7a5 5 0 0 0-5-5zm-7 9v9h14v-9H5zm4 2h2v5H9v-5z' },
    { title: 'Desafíos', desc: 'Crear, editar y monitorear', route: '/admin/desafios', iconPath: 'M4 4h16v4H4V4zm0 6h10v10H4V10zm12 0h4v10h-4V10z' },
    { title: 'Vouchers', desc: 'Tipos, cupos y canjes', route: '/admin/vouchers', iconPath: 'M4 6h16v4H4zM4 14h16v4H4z' },
    { title: 'Entregas', desc: 'Pendientes y validadas', route: '/admin/entregas', iconPath: 'M3 6h18v2H3zM6 10h12v2H6zM8 14h8v2H8z' },
    { title: 'Biblioteca', desc: 'Contenidos educativos', route: '/admin/biblioteca', iconPath: 'M4 5h14a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5z' },
    { title: 'Indicadores', desc: 'Gráficos y reportes', route: '/admin/indicadores', iconPath: 'M5 19V8h3v11H5zm5 0V5h3v14h-3zm5 0v-7h3v7h-3z' },
    { title: 'Configuración', desc: 'Parámetros del sistema', route: '/admin/config', iconPath: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  ]);

  // --- Actividad reciente (ficticia) ---
  ultUsuarios = signal<UsuarioMini[]>([
    { id: 221, nombre: 'María Díaz', tipo: 'CLIENTE', email: 'm.diaz@example.com' },
    { id: 222, nombre: 'Juan Pérez', tipo: 'OPERARIO', email: 'j.perez@example.com' },
    { id: 223, nombre: 'Ana Ruiz', tipo: 'CLIENTE', email: 'a.ruiz@example.com' },
    { id: 224, nombre: 'Carlos Soto', tipo: 'ADMIN', email: 'c.soto@example.com' },
    { id: 225, nombre: 'Lucía Benítez', tipo: 'CLIENTE', email: 'l.benitez@example.com' },
  ]);

  ultEntregas = signal<EntregaMini[]>([
    { id: 901, cliente: 'María Díaz',  desafio: 'EcoBotellas', estado: 'VALIDADA',  fecha: '2025-10-05' },
    { id: 902, cliente: 'Juan Pérez',  desafio: 'Papel & Cartón', estado: 'PENDIENTE', fecha: '2025-10-05' },
    { id: 903, cliente: 'Ana Ruiz',    desafio: 'Vidrio Limpio', estado: 'VALIDADA',  fecha: '2025-10-04' },
    { id: 904, cliente: 'Carlos Soto', desafio: 'EcoBotellas',   estado: 'RECHAZADA', fecha: '2025-10-04' },
    { id: 905, cliente: 'Lucía Benítez', desafio: 'Metales',     estado: 'VALIDADA',  fecha: '2025-10-03' },
  ]);
}
