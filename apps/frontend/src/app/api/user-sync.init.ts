import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { UsuariosApi } from './usuarios.api';
import { keycloak, ensureKeycloakInit } from '../auth/keycloak';
import { AppRoleService } from '../auth/app-role.service';

async function doSync(usuariosApi: UsuariosApi, appRole: AppRoleService) {
  try {
    const synced = await firstValueFrom(usuariosApi.syncMe());
    console.log('[user-sync] Usuario sincronizado:', synced);

    //Guarda rol de BD como fallback inmediato (1=ADMIN,2=OPERARIO,3=CLIENTE)
    appRole.setFromBackend(Number(synced?.idRolUsuario ?? null));

    //Fuerza el refresh del access token para que traiga los realm roles recien asignados.
    //minValidity alto para OBLIGAR refresh aunque el token no este por expirar.
    try {
      const refreshed = await keycloak.updateToken(3600); // 1 hora de margen => fuerza refresh
      console.log('[user-sync] Token refrescado (forzado):', refreshed);
    } catch (e) {
      console.warn('[user-sync] updateToken(forzado) falló:', e);
    }

    //traer perfil
    try {
      const me = await firstValueFrom(usuariosApi.me());
      console.log('[user-sync] Perfil actual:', me);
    } catch (err) {
      console.warn('[user-sync] /usuarios/me falló (no crítico):', err);
    }
  } catch (err) {
    console.error('[user-sync] ERROR /usuarios/me/sync:', err);
  }
}

export function syncUserOnBootFactory() {
  const platformId = inject(PLATFORM_ID);
  const usuariosApi = inject(UsuariosApi);
  const appRole = inject(AppRoleService);
  const isBrowser = isPlatformBrowser(platformId);

  return async () => {
    if (!isBrowser) return true;

    await ensureKeycloakInit();

    if (keycloak.authenticated) {
      await doSync(usuariosApi, appRole);
    } else {
      console.warn('[user-sync] No authenticated after KC init; listening for onAuthSuccess');
    }

    const prev = keycloak.onAuthSuccess;
    keycloak.onAuthSuccess = () => {
      try { prev?.(); } catch {}
      console.log('[user-sync] onAuthSuccess → sincronizando…');
      void doSync(usuariosApi, appRole);
    };

    return true;
  };
}
