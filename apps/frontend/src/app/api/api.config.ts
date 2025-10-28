export const API_BASE = 'http://localhost:3001'; // backend NestJS

//Construye URL absolutas contra el backend
export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}
