import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Rol = 'admin' | 'operario' | 'cliente';
type FiltroRol = 'todos' | Rol;

interface Usuario {
  id: number;
  nombreUsuario: string;
  propietario: string;        // Razón social o nombre completo del propietario
  dniCuitCuil: string;
  email: string;
  tipo: Rol;
}

@Component({
  selector: 'app-usuarios-administrador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-administrador.component.html',
  styleUrls: ['./usuarios-administrador.component.scss'],
})
export class UsuariosAdministradorComponent {

  // ===== Estado / filtros / paginación =====
  readonly pageSize = 50;

  // Arranca vacío (cuando integremos backend, seteamos aquí el resultado del endpoint)
  all = signal<Usuario[]>([]);

  q = signal<string>('');                      // búsqueda
  filtroRol = signal<FiltroRol>('todos');      // filtro por rol
  page = signal<number>(1);

  private isFiltroRol(v: string): v is FiltroRol {
    return v === 'todos' || v === 'admin' || v === 'operario' || v === 'cliente';
  }

  onBuscar(value: string) {
    this.q.set(value.trim().toLowerCase());
    this.page.set(1);
  }

  onRolChange(value: string) {
    if (this.isFiltroRol(value)) {
      this.filtroRol.set(value);
      this.page.set(1);
    }
  }

  // Contadores
  total = computed(() => this.all().length);
  totalAdmins = computed(() => this.all().filter(u => u.tipo === 'admin').length);
  totalOperarios = computed(() => this.all().filter(u => u.tipo === 'operario').length);
  totalClientes = computed(() => this.all().filter(u => u.tipo === 'cliente').length);

  // Filtro + búsqueda
  filtered = computed(() => {
    const term = this.q();
    const rol = this.filtroRol();

    return this.all().filter(u => {
      const matchesRol = rol === 'todos' ? true : u.tipo === rol;
      if (!matchesRol) return false;

      if (!term) return true;

      const blob = `${u.id} ${u.nombreUsuario} ${u.propietario} ${u.dniCuitCuil} ${u.email} ${u.tipo}`.toLowerCase();
      return blob.includes(term);
    });
  });

  pages = computed(() => {
    const n = Math.ceil(this.filtered().length / this.pageSize);
    return n > 0 ? n : 1;
  });

  visible = computed(() => {
    const p = this.page();
    const start = (p - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  canPrev = computed(() => this.page() > 1);
  canNext = computed(() => this.page() < this.pages());

  goPrev() { if (this.canPrev()) this.page.update(p => p - 1); }
  goNext() { if (this.canNext()) this.page.update(p => p + 1); }
  goTo(page: number) {
    const max = this.pages();
    if (page >= 1 && page <= max) this.page.set(page);
  }

  // Acciones (por ahora, placeholders)
  verUsuario(u: Usuario) {
    // Aquí podrías abrir un modal o navegar a un detalle
    console.log('Ver usuario', u);
  }

  editarUsuario(u: Usuario) {
    // Aquí podrías navegar a /usuarios/:id/editar
    console.log('Editar usuario', u);
  }

  // ===== Demo helper opcional (si querés ver datos sin backend) =====
  cargarDemo() {
    const demo: Usuario[] = Array.from({ length: 123 }).map((_, i) => {
      const id = i + 1;
      const roles: Rol[] = ['admin', 'operario', 'cliente'];
      const tipo = roles[id % roles.length];
      return {
        id,
        nombreUsuario: `usuario_${id}`,
        propietario: tipo === 'cliente' ? `Ciudadano ${id}` : (tipo === 'operario' ? `Operario ${id}` : `Admin ${id}`),
        dniCuitCuil: `20-1234567${(id % 10)}-3`,
        email: `user${id}@demo.test`,
        tipo,
      };
    });
    this.all.set(demo);
    this.page.set(1);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

}
