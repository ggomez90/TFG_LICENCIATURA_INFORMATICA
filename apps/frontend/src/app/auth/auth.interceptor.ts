import { HttpInterceptorFn } from '@angular/common/http';
import { keycloak } from './keycloak';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = keycloak.token;
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
