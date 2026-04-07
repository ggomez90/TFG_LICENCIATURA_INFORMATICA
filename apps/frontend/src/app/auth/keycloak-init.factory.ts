import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { keycloak } from './keycloak';

export function initializeKeycloak() {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  return async () => {
    if (!isBrowser) return true;

    const stale = document.getElementById('app-wait-style');
    if (stale) stale.remove();

    try {
      await keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });

      (window as any).kc = keycloak;

      setInterval(async () => {
        try {
          if (keycloak.authenticated) {
            await keycloak.updateToken(60);
          }
        } catch {
          if (keycloak.authenticated) {
            keycloak.login();
          }
        }
      }, 20_000);

      return true;
    } finally {
      document.documentElement.classList.add('app-ready');
    }
  };
}