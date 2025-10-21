// apps/frontend/src/app/auth/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn } from '@angular/router';
import { keycloak } from './keycloak';

/**
 * Exige sesión. Si no hay, manda a Keycloak y vuelve a la URL intentada.
 * En SSR (no-browser) no bloquea.
 */
export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    // SSR: no bloquear navegación
    return true;
  }

  if (keycloak.authenticated) return true;

  // Sin sesión → pedir login y cortar navegación
  try {
    keycloak.login({ redirectUri: window.location.href });
  } catch {
    // no-op
  }
  return false;
};
