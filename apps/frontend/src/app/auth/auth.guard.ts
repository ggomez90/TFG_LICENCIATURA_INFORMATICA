import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn } from '@angular/router';
import { keycloak } from './keycloak';

//Exige sesion, si no hay manda a Keycloak y vuelve a la URL intentada
export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    //no bloquea navegacion
    return true;
  }

  if (keycloak.authenticated) return true;

  //Si no hay sesion, pedir login y cortar navegación
  try {
    keycloak.login({ redirectUri: window.location.href });
  } catch {
    // no-op
  }
  return false;
};
