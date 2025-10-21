import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-forbidden-page',
  template: `<h3>403 — Acceso denegado</h3><p>No tenés los permisos requeridos.</p>`,
})
export class ForbiddenPage {}
