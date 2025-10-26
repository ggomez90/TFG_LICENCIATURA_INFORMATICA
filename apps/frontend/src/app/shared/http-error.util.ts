// apps/frontend/src/app/shared/http-error.util.ts
import { HttpErrorResponse } from '@angular/common/http';

export function normalizeHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const status = err.status || 0;

    // Mensaje más específico si backend envía { message: string | string[] }
    const body = err.error;
    const msg =
      (typeof body === 'string' && body) ||
      (body?.message && (Array.isArray(body.message) ? body.message.join(' ') : String(body.message))) ||
      (body?.error && String(body.error)) ||
      err.statusText ||
      '';

    // Casos frecuentes
    if (status === 0) return 'No se pudo conectar con el servidor.';
    if (status === 401) return msg || 'No autorizado (401). Iniciá sesión nuevamente.';
    if (status === 403) return msg || 'Acceso denegado (403).';
    if (status === 404) return msg || 'Recurso no encontrado (404).';
    if (status === 409) return msg || 'Conflicto (409). Puede existir un usuario con ese email/usuario.';
    if (status >= 500) return msg || 'Error interno del servidor.';

    return msg || `Error HTTP ${status}.`;
  }

  try {
    return String(err ?? 'Error desconocido');
  } catch {
    return 'Error desconocido';
  }
}
