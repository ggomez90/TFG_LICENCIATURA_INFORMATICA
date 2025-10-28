import { ApplicationConfig, APP_INITIALIZER, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { authInterceptor } from './auth/auth.interceptor';
import { initializeKeycloak } from './auth/keycloak-init.factory';
import { UsuariosApi } from './api/usuarios.api';
import { syncUserOnBootFactory } from './api/user-sync.init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    // 1) Keycloak
    { provide: APP_INITIALIZER, useFactory: initializeKeycloak, multi: true },

    // 2) Sincronizar usuario al boot
    { provide: APP_INITIALIZER, useFactory: syncUserOnBootFactory, deps: [UsuariosApi], multi: true },
  ],
};
