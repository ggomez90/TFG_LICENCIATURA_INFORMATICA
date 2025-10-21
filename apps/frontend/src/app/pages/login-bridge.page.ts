// apps/frontend/src/app/pages/login-bridge.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { keycloak } from '../auth/keycloak';

@Component({
  standalone: true,
  selector: 'app-login-bridge',
  imports: [CommonModule],
  template: `
    <div class="w-full h-dvh grid place-items-center">
      <div>Redirigiendo…</div>
    </div>
  `,
})
export class LoginBridgePage implements OnInit {
  private router = inject(Router);

  async ngOnInit() {
    // Si estamos autenticados (porque venimos de KC), vamos directo al menú
    if ((keycloak as any)?.authenticated) {
      // Si querés, acá también podés decidir por rol qué submenú abrir.
      this.router.navigateByUrl('/menu-principal');
    }
    // Si NO hay sesión, el authGuard ya disparó el login: no hacemos nada acá.
  }
}
