// base de la API detrás de Nginx, todas las llamas al back tendran /api para no diferencias con las url del front
export const API_BASE = '/api';

// Join que evita dobles barras y garantiza el prefijo API
export function apiUrl(path: string): string {
  if (!path) return API_BASE;
  const left = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const right = path.startsWith('/') ? path : `/${path}`;
  return `${left}${right}`;
}
