import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  AuthGuard,
  ResourceGuard,
  RoleGuard,
} from 'nest-keycloak-connect';

import { PrismaModule } from './prisma/prisma.module'; // <-- agregado
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SecureController } from './secure.controller';

@Module({
  imports: [
    PrismaModule, // <-- agregado
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL ?? 'http://keycloak:8081',
      realm: process.env.KEYCLOAK_REALM ?? 'yo-reciclo',
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'api-yo-reciclo',
      secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
    }),
  ],
  controllers: [AppController, SecureController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ResourceGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
