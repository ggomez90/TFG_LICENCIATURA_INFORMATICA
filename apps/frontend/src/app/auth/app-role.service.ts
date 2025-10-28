import { Injectable, signal } from '@angular/core';

//Guarda el rol de aplicacion proveniente de la BD para usarlo como fallback hasta que el JWT traiga el realm role
@Injectable({ providedIn: 'root' })
export class AppRoleService {
  //1=ADMIN, 2=OPERARIO, 3=CLIENTE, null=desconocido
  private roleIdSig = signal<number | null>(null);

  setFromBackend(id: number | null | undefined) {
    if (id === 1 || id === 2 || id === 3) this.roleIdSig.set(id);
    else this.roleIdSig.set(null);
    //para debug en consola
    (window as any).appRoleId = this.roleIdSig();
  }

  clear() {
    this.roleIdSig.set(null);
    (window as any).appRoleId = null;
  }

  currentId(): number | null {
    return this.roleIdSig();
  }

  //Devuelve true si el rol de BD es igual al rol pedido. Mapeo simple 1=ADMIN/ADMINISTRADOR, 2=OPERARIO, 3=CLIENTE
  matchesRoleName(requested: string): boolean {
    const want = (requested ?? '').trim().toUpperCase();
    const id = this.roleIdSig();
    if (id === 1) return want === 'ADMIN' || want === 'ADMINISTRADOR';
    if (id === 2) return want === 'OPERARIO';
    if (id === 3) return want === 'CLIENTE';
    return false;
  }

  matchesAny(names: string[]): boolean {
    for (const n of names ?? []) if (this.matchesRoleName(n)) return true;
    return false;
  }
}
