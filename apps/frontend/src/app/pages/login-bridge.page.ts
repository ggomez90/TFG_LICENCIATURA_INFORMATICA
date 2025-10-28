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
    // Si está autenticados porque venimos de KC va directo al menu
    if ((keycloak as any)?.authenticated) {
      this.router.navigateByUrl('/menu-principal');
    }
    // Si NO hay sesion activa el authGuard dispara la redireccion al login
  }
}
