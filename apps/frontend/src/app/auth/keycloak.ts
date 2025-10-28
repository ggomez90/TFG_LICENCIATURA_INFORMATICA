import Keycloak, { KeycloakInstance } from 'keycloak-js';

// Detección de entorno sin DI (SSR-safe)
const isBrowser = typeof window !== 'undefined';

let _kc: KeycloakInstance | null = null;

//Export público
export const keycloak: KeycloakInstance = (() => {
  if (!isBrowser) return {} as unknown as KeycloakInstance;
  if (_kc) return _kc;
  _kc = new (Keycloak as any)({
    // Desde el navegador usa localhost
    url: 'http://localhost:8081',
    realm: 'yo-reciclo',
    clientId: 'angular-yo-reciclo',
  });
  return _kc!;
})();

//Inicialización segura (no usa window en SSR). check-sso: si hay sesión vuelve con token, si no hay NO redirige, programa auto-refresh del token
export async function ensureKeycloakInit(): Promise<boolean> {
  if (!isBrowser) return true;

  try {
    const ok = await keycloak.init({
      onLoad: 'check-sso',   // NO fuerza login acá
      pkceMethod: 'S256',
      checkLoginIframe: false,
      // silentCheckSsoRedirectUri: `${window.location.origin}/assets/silent-check-sso.html`,
    });

    // Auto-refresh: cada 20s, si quedan <= 60s, refresca
    setInterval(async () => {
      try {
        await keycloak.updateToken(60);
      } catch {
        // Si falla el refresh, el guard va a forzar el login
      }
    }, 20_000);

    return ok;
  } catch {
    // no romper el bootstrap
    return false;
  }
}

//Helper opcional para forzar login desde algún componente/servicio.
export async function loginIfNeeded(): Promise<void> {
  if (!isBrowser) return;
  if (!(keycloak as any).authenticated) {
    try {
      await keycloak.login({ redirectUri: window.location.origin });
    } catch {
      // no-op
    }
  }
}
