# Informe técnico — Estructura, tecnologías y configuración del proyecto “¡Yo Reciclo!”

Se documenta todo lo instalado, creado y configurado desde el inicio del proyecto: Angular (PWA) + NestJS + MySQL, con Keycloak para autenticación/roles, Nginx como proxy inverso y Docker Compose orquestando todos los servicios.

# 1.	Tecnologías externas instaladas en la PC.

* Git: Control de versiones para versionar el código.
* Docker Desktop: Motor de contenedores. Ejecuta cada pieza (DB, backend, frontend, Keycloak, Nginx) en contenedores aislados y portables. Beneficio: despliegue reproducible, sin “instalar” servicios en el SO del host.
* Node.js (gestionado con nvm/nvm-windows)
Runtime de JavaScript/TypeScript. Con nvm fijás la versión por proyecto. Beneficio: consistencia entre entornos; proyectos diferentes pueden usar versiones distintas de Node sin conflicto.
* PNPM (administrador de paquetes): Más rápido y eficiente en espacio que npm/yarn. Se usa en frontend y backend.
* VS Code
* MySQL Workbench solo como cliente/visualizador. El servidor MySQL corre en Docker. Beneficio: inspección de datos y ejecuciones SQL de forma visual.

# 2.	Estructura del repositorio

# Yo_Reciclo/ (raíz)
* Contiene todo el monorepo: frontend, backend e infra (orquestación).
* .gitignore

  
# apps/backend/ (API NestJS)
*	Dockerfile: imagen de desarrollo. Instala deps con PNPM, genera Prisma Client y arranca Nest en modo watch.
*	.dockerignore: evita copiar node_modules, dist, .env, etc. al build context.
*	package.json: dependencias (Nest, nest-keycloak-connect, Prisma) y scripts (start, start:dev, etc.).
*	tsconfig.json: configuración TypeScript (decorators, target, module nodenext, etc.).
*	prisma/schema.prisma: esquema Prisma introspectado desde MySQL; define modelos y genera el cliente tipado.
*	src/ (código fuente Nest):
  *	app.module.ts: módulo raíz; registra KeycloakConnectModule (URL/realm/cliente/secret), PrismaModule y los guards globales (Auth/Resource/Role).
  *	app.controller.ts: controlador base /api; endpoints simples (ej. health/check).
  *	app.service.ts: lógica de ejemplo/soporte para app.controller.
  *	secure.controller.ts: endpoints protegidos bajo /api/secure:
    *	/ping (requiere token válido)
    *	/cliente, /operario, /admin (requieren roles de realm: CLIENTE, OPERARIO, ADMINISTRADOR).
  * src/prisma/:
    * prisma.module.ts: expone PrismaService para inyección en la app.
    * prisma.service.ts: inicializa y cierra conexión de PrismaClient (lifecycle de Nest).

# apps/frontend/ (Angular SPA + PWA + OIDC)
* Dockerfile: contenedor de desarrollo; instala deps y levanta el dev server (4200).
* .dockerignore: excluye node_modules, caches y artefactos de build.
* package.json: dependencias Angular, keycloak-js, service worker; scripts (start, build, etc.).
* tsconfig.json: configuración TS del proyecto Angular.
* ngsw-config.json: configuración del Service Worker de Angular (PWA: caching de assets/rutas).
* src/index.html: documento host de la SPA.
* src/main.ts: arranque de la app con bootstrapApplication.
* src/app/:
  * app.ts: componente raíz standalone; muestra usuario, botones de prueba (API segura/rutas por rol) y logout.
  * app.routes.ts: rutas de navegación (/cliente, /operario, /admin, /forbidden) con protección de UI por rol.
  * app.config.ts: configuración de proveedores:
    * provideRouter(routes)
    * provideHttpClient con interceptor que añade Authorization: Bearer … a /api
    * APP_INITIALIZER para inicializar Keycloak antes del bootstrap
    * provideServiceWorker (PWA) activo en prod
  * auth/:
    * keycloak.ts: instancia única de keycloak-js (client angular-yo-reciclo).
    * keycloak-init.factory.ts: APP_INITIALIZER (login requerido + auto-refresh de token).
    * auth.interceptor.ts: adjunta el token Bearer a las peticiones HTTP hacia /api.

# infra/ (orquestación y proxy)
* docker-compose.yml: define y conecta todos los servicios:
  * db (MySQL 8.0): BD yo_reciclo, root 9029, puerto host 3307, volumen db_data (persistencia).
  * adminer: GUI DB en 8080 (server: db).
  * backend: NestJS en 3001; variables de entorno para MySQL y Keycloak (realm, clientId y secret).
  * frontend: Angular dev server en 4200.
  * nginx: proxy inverso en 80:
    * / → frontend:4200
    * /api → backend:3000
  * keycloak (26.0): IdP en 8081 con volumen keycloak_data (persistencia de realm/usuarios/clients).
* nginx/default.conf: reglas del reverse proxy:
  * location / → frontend
  * location /api/ → backend
  * cabeceras y proxy buffers básicos.
* keycloak/yo-reciclo-realm.json: export del realm (opcional para importación automática o manual); contiene configuración de yo-reciclo (clientes, roles, etc.) para reproducibilidad.

Angular (SPA/PWA) protegido por Keycloak en el front, NestJS validando tokens/roles en el back, MySQL como almacenamiento, Nginx como puerta de entrada única y Docker Compose para levantar todo junto.

# 3.	Orquestación con Docker Compose (infra)
Archivo: infra/docker-compose.yml
Servicios definidos:
* db (MySQL 8.0):
  * Variables: MYSQL_DATABASE=yo_reciclo, MYSQL_ROOT_PASSWORD=9029
  * Puerto host: 3307 → contenedor: 3306
  * Volumen: db_data:/var/lib/mysql (persistencia de datos).
  * Plugin: mysql_native_password para compatibilidad.
* adminer:
  * GUI para administrar MySQL.
  * Puerto: 8080 (URL: http://localhost:8080).
  * Útil para importar el dump y ver tablas/datos.
* backend (NestJS):
  * Build context: apps/backend
  * Env:
    * DATABASE_URL=mysql://root:9029@db:3306/yo_reciclo
    * KEYCLOAK_URL=http://keycloak:8081
    * KEYCLOAK_REALM=yo-reciclo
    * KEYCLOAK_CLIENT_ID=api-yo-reciclo
    * KEYCLOAK_CLIENT_SECRET=<secret del cliente confidencial>
  * Puerto: 3001 (mapeado internamente por Nginx).
  * Volumen “bind” del código para desarrollo.
  * Objetivo: exponer API en /api (vía Nginx).
* frontend (Angular):
  * Build context: apps/frontend
  * Puerto: 4200 (servido por el contenedor; Nginx reexpone en http://localhost).
  * Volumen “bind” del código para HMR/recarga en desarrollo.
* nginx
  * Puerto: 80 → se accede por http://localhost/
  * Configuración en infra/nginx/default.conf:
    * / → frontend:4200
    * /api → backend:3000 (Nest levanta en 3000 interno).
  * Objetivo: proxy inverso único para el usuario.
* keycloak (26.0)
  * Comando: start-dev en puerto 8081.
  * Variables: KEYCLOAK_ADMIN=admin, KEYCLOAK_ADMIN_PASSWORD=admin.
  * Volumen: keycloak_data (persistencia de realm/users/clients).
  * Objetivo: IdP centralizado (realm yo-reciclo, clients, roles, usuarios).
* Volúmenes persistentes:
  * db_data (MySQL), keycloak_data (Keycloak)
 
# 4.	Nginx (proxy inverso)

Archivo: infra/nginx/default.conf (resumen de intención)
* Reverse proxy:
  * location / → proxy_pass http://frontend:4200/
  * location /api/ → proxy_pass http://backend:3000/
* Encabezados estándar de proxy y buffering básico.
* Pensado para unificar acceso en http://localhost y no exponer puertos de cada contenedor al usuario final.

# 5.	Base de datos (MySQL + Adminer)

* MySQL: contenedor db con volumen db_data (persistente).
* Adminer: http://localhost:8080
  * Server: db
  * Usuario: root
  * Password: 9029
  * DB: yo_reciclo
* Importación: desde Adminer se cargó el dump SQL del DER (tablas y, si aplica, datos semilla).
* Conexión desde el backend: vía DATABASE_URL y Prisma.

# 6.	Backend (NestJS)
  # 6.1.	Dockerfile del backend
  Archivo: apps/backend/Dockerfile
  * Imagen base node:22-alpine + apk add openssl (requerido por Prisma en Alpine).
  * Instala dependencias con PNPM.
  * Copia prisma/ y ejecuta pnpm prisma generate (cliente Prisma tipado).
  * Copia del resto del código y CMD ["pnpm","start:dev"].

  # 6.2.	Configuración clave
  Archivo: apps/backend/src/app.module.ts
  * Importa:
    * KeycloakConnectModule.register(...) con:
      * authServerUrl=KEYCLOAK_URL
      * realm=yo-reciclo
      * clientId=api-yo-reciclo
      * secret=KEYCLOAK_CLIENT_SECRET (cliente confidential).
    * PrismaModule (inyección de PrismaService en la app).
 * Provee guards globales:
   * AuthGuard, ResourceGuard, RoleGuard (de nest-keycloak-connect).
* Controladores: AppController, SecureController.

  Archivo: apps/backend/src/app.controller.ts
  * Controlador base bajo prefijo /api.

  Archivo: apps/backend/src/secure.controller.ts
  * Controlador bajo /api/secure.
  * Endpoints de prueba con roles:
    * GET /api/secure/ping → { ok: true, secure: true }
    * GET /api/secure/cliente → @Roles({ roles: ['realm:CLIENTE'] })
    * GET /api/secure/operario → @Roles({ roles: ['realm:OPERARIO'] })
    * GET /api/secure/admin → @Roles({ roles: ['realm:ADMINISTRADOR'] })

  Archivo: apps/backend/src/prisma/prisma.module.ts y prisma.service.ts
  * PrismaService extiende PrismaClient:
    * Conecta en onModuleInit(), desconecta en onModuleDestroy().
  * Exporta el servicio para uso en controladores/servicios.
  
  Archivo: apps/backend/prisma/schema.prisma
  * Generado por introspección de la BD existente.
  * Modelos reflejan el DER (e.g., usuario, desafio, entrega, movimiento_puntos, voucher_tipo, etc.).

  Archivo: apps/backend/tsconfig.json
  * Target ES2023, módulo NodeNext, emitDecoratorMetadata, experimentalDecorators, types: ["node"], etc.
  * Preparado para TS moderno y Nest.

  Archivo: .dockerignore
  * Evita copiar node_modules, dist, .env, .git, .vscode al build context.
  
  Dependencias principales (backend)
  * @nestjs/common, @nestjs/core, @nestjs/platform-express (NestJS)
  * reflect-metadata (decoradores TS)
  * nest-keycloak-connect (integración Keycloak como guard y roles)
  * @prisma/client (cliente ORM tipado) y prisma (CLI, dev)
  * dotenv (si se requieren variables locales en dev)

# 7.	Keycloak (IdP)

* Servicio: keycloak en Docker (puerto 8081).
* Admin Console: http://localhost:8081/admin (admin/admin).
* Realm: yo-reciclo.
* Clientes definidos:
  * angular-yo-reciclo (público)
    * OIDC front-channel (Authorization Code + PKCE).
    * Redirecciones permitidas: http://localhost, http://localhost:4200 (según necesidad).
    * Usado por el frontend con keycloak-js.
* api-yo-reciclo (confidential)
  * Validación de tokens en el backend.
  * Usa client secret (fijado en docker-compose.yml como env del backend).
  * Nota: el secreto es persistente dentro del keycloak_data y no cambia a menos que se regenere manualmente.
* Roles de realm:
  * ADMINISTRADOR, OPERARIO, CLIENTE. Asignados a usuarios de prueba (p. ej., admintester, operariotester, clientetester) para validar endpoints y rutas.
 
# 8. Verificación de email (Mailtrap)

El proyecto utiliza Mailtrap como servicio SMTP de pruebas para el envío de correos de verificación de email durante el alta de usuarios. Esto permite probar el flujo completo (verificar email + setear contraseña inicial) sin enviar correos reales.
Configuración utilizada:
* Host: sandbox.smtp.mailtrap.io
* Puerto: 587
* From: noreply@yoreciclo.com
* TLS: StartTLS habilitado (SSL desactivado)
* Autenticación: habilitada (username/password provistos por Mailtrap)

La configuración se encuentra aplicada en el realm yo-reciclo dentro de Keycloak → Realm Settings → Email.
Mailtrap captura todos los emails enviados por el sistema, permitiendo visualizar enlaces de verificación, restablecimiento de contraseña y pruebas de notificaciones sin exponer correos reales.

# 9.	Frontend (Angular + PWA + OIDC)

  # 9.1.	Dockerfile del frontend
  Archivo: apps/frontend/Dockerfile
  * Imagen base node:22-alpine.
  * Instala dependencias con PNPM.
  * Copia del código y arranque del dev server (puerto 4200 en contenedor).
  * En desarrollo, Nginx proxya al dev server de Angular.

  # 9.2.	Piezas clave de la app Angular
  Archivo: apps/frontend/src/app/app.config.ts
  * Proveedores:
    * provideRouter(routes) (rutas /cliente, /operario, /admin, /forbidden).
    * provideHttpClient(withInterceptors([authInterceptor])): agrega Bearer token a cada request a /api.
    * APP_INITIALIZER → initializeKeycloak (inicializa sesión OIDC antes del bootstrap).
    * provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() ... }): PWA. En dev puede permanecer deshabilitado.

  Archivo: apps/frontend/src/app/app.routes.ts
  * Rutas por rol (protecciones de UI).
  * En caso de falta de permisos, redirige a /forbidden.

  Archivo: apps/frontend/src/app/app.ts
  * Componente raíz (standalone) con:
    * Botón “Probar API segura” que llama a /api/secure/ping.
    * Navegación rápida a /cliente, /operario, /admin.
    * Muestra usuario logueado (preferred_username) y botón Logout.

  Auth (OIDC)
  * apps/frontend/src/app/auth/keycloak.ts
    * Instancia única keycloak de keycloak-js.
  * apps/frontend/src/app/auth/keycloak-init.factory.ts
    * initializeKeycloak() (APP_INITIALIZER) con:
    * onLoad: 'login-required' (fuerza login al cargar).
    * pkceMethod: 'S256'.
    * checkLoginIframe: false.
    * Auto-refresh del token cada X segundos (keycloak.updateToken(...)) para mantener la sesión.
  * apps/frontend/src/app/auth/auth.interceptor.ts
    * Adjunta Authorization: Bearer <token> automáticamente a todas las peticiones HTTP hacia /api.

  PWA
  * apps/frontend/manifest.webmanifest: nombre, íconos, tema, start_url, etc.
  * apps/frontend/ngsw-config.json: configuración del Angular Service Worker (caché de assets/requests).
  * app.config.ts habilita el SW solo en producción (enabled: !isDevMode()).

  Dependencias principales (frontend)
  * @angular/* (framework)
  * keycloak-js (OIDC)
  * @angular/service-worker (PWA)
  * rxjs, zone.js (runtime Angular)

# 10.	Flujo de autenticación y autorización (resumen)
* El usuario accede a http://localhost.
* Keycloak-js (APP_INITIALIZER) redirige a Keycloak para login (angular-yo-reciclo).
* Al volver, Keycloak-js guarda access token y id token en el front.
* El interceptor HTTP añade el Bearer a cada request /api.
* El backend (nest-keycloak-connect) valida el token contra api-yo-reciclo + realm yo-reciclo.
* Los guards aplican los roles requeridos (p. ej., realm:CLIENTE).
* Respuesta de los endpoints según permisos.
* Auto-refresh renueva token antes de expirar para evitar cortes de sesión.

# 11.	Configuración de variables de entorno.
Crear archivo .env dentro de apps/backend y pegar el siguiente contenido:

DATABASE_URL="mysql://root:9029@db:3306/yo_reciclo"

KEYCLOAK_URL=http://keycloak:8081

KEYCLOAK_REALM=yo-reciclo

KEYCLOAK_CLIENT_ID=api-yo-reciclo

KEYCLOAK_CLIENT_SECRET=UjGKTBJhTnApd6ABV4Jbbc5BPZMp34Lg

KEYCLOAK_REALM_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqDYH2atg6WfuOj9oPfoJdM0F+4ibVzWFYss33irO635qqnZdUfu6+qYoQySpWyLHeJPZVx0tQTxrj497ZSRoZesmGM6BHPwQLhrrTBfXiNMlKzAIojzFu+ydeuVyoT4AC+L62OOPMbO5EVTZTR0EbrseGuzit+JhjCRFqJXqMjOXcPM5UXHxfdNHf5Y+ITNREPdENZpeJaVQp+bnw2+vGb/2mbV/XfT7qZxlVSYBtuPgJ0sff2avRaHFYwiJEGRKSoz/5qmH4aJ2pyFx+shSpMM9fGTQPQKoS/zJh6GEZMIlVca8wBqf1ZP+RwiSVUURrPv6Ew7ovUaPr5CdsbbK6QIDAQAB

KEYCLOAK_ADMIN_USER=admin

KEYCLOAK_ADMIN_PASS=admin


# 12.	Ciclo de vida y puesta en marcha.
* Crear carpeta raiz Yo_Reciclo y dentro de el clonar el repositorio: git clone https://github.com/ggomez90/TFG_LICENCIATURA_INFORMATICA.git
* Construir y levantar todo el proyecto:
  * Desde carpeta infra ejecutar → docker compose up --build
* Solo levantar el proyecto (en caso de que ya se haya compilado antes y no haya sufrido cambios):
  * Desde carpeta infra ejecutar → docker compose up
* Restarurar contenedores (de ser necesario):
  * Desde carpeta infra ejecutar → docker compose down -v 
* Ver logs:
  * docker compose logs -f <servicio> (ej.: backend, frontend, db, keycloak, nginx)
* Entrar a Keycloak:
  * http://localhost:8081/admin (usuario y calve admin/admin) → realm yo-reciclo
* App:
  * Web Angular: http://localhost/ o http://localhost/4200 
  * Adminer de la bd: http://localhost:8080 (Motor MySQL, server: db, user: root, pass: 9029, base de datos: yo_reciclo)
* Persistencia:
  * Datos MySQL → volumen infra_db_data
  * Realm/usuarios Keycloak → volumen infra_keycloak_data

# 13. Usuarios de prueba
Para el acceso a la app se conceder usuarios de prueba de diferentes roles:
* ADMINISTRADOR: Usuario: admintester | Pass: Administrador1
* CLIENTE: Usuario: clientetester | Pass: Clientetester1
* OPERARIO: Usuario: operariotester | Pass: Operariotester1

