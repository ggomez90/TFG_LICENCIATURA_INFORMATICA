import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  AuthGuard,
  ResourceGuard,
  RoleGuard,
} from 'nest-keycloak-connect';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule, KeycloakAuthGuard, RolesGuard } from './auth';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL ?? 'http://keycloak:8081',
      realm: process.env.KEYCLOAK_REALM ?? 'yo-reciclo',
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'api-yo-reciclo',
      secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
    }),
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
