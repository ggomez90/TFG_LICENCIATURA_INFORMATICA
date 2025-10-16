import { Module } from '@nestjs/common';
import {
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  AuthGuard,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL!,   // ej: http://keycloak:8081
      realm: process.env.KEYCLOAK_REALM!,         // ej: yo-reciclo
      clientId: process.env.KEYCLOAK_CLIENT_ID!,  // ej: api-yo-reciclo

      // Si tu cliente en Keycloak es CONFIDENTIAL (tu compose trae KEYCLOAK_CLIENT_SECRET):
      secret: process.env.KEYCLOAK_CLIENT_SECRET!,

      // Si fuera PUBLIC, quitá "secret" y poné:
      // public: true,

      // Enums (no strings):
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
      tokenValidation: TokenValidation.ONLINE,
    }),
  ],
  providers: [
    // Activa los guards globalmente si querés:
    { provide: 'APP_GUARD', useClass: AuthGuard },
    { provide: 'APP_GUARD', useClass: ResourceGuard },
    { provide: 'APP_GUARD', useClass: RoleGuard },
  ],
})
export class AuthModule {}
