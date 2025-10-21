// apps/frontend/src/app/auth/keycloak-init.factory.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { keycloak } from './keycloak';

export function initializeKeycloak() {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  return async () => {
    if (!isBrowser) return true;

    // Si por alguna razón quedó algún estilo viejo que ocultaba el root, lo quitamos.
    const stale = document.getElementById('app-wait-style');
    if (stale) stale.remove();

    try {
      // Fuerza login si no hay sesión. Durante este tiempo el root está oculto por CSS.
      await keycloak.init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });

      // Útil para debug
      (window as any).kc = keycloak;

      // Auto-refresh cada 20s si faltan <= 60s
      setInterval(async () => {
        try { await keycloak.updateToken(60); } catch { keycloak.login(); }
      }, 20_000);

      return true;
    } finally {
      // *** CLAVE: al terminar el init (tras volver del login) mostramos la app
      document.documentElement.classList.add('app-ready');
    }
  };
}
