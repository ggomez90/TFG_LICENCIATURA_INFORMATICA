import { Module } from '@nestjs/common';
import {
  KeycloakConnectModule,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import { KeycloakAdminService } from './keycloak-admin.service';

const REALM = process.env.KEYCLOAK_REALM || 'yo-reciclo';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'api-yo-reciclo';
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
const REALM_PUBKEY = process.env.KEYCLOAK_REALM_PUBLIC_KEY;

const PUBLIC_AUTH_SERVER_URL = 'http://localhost:8081';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: PUBLIC_AUTH_SERVER_URL, // para que el issuer esperado sea http://localhost:8081/realms/yo-reciclo
      realm: REALM,
      clientId: CLIENT_ID,
      secret: CLIENT_SECRET,
      realmPublicKey: REALM_PUBKEY,
      tokenValidation: TokenValidation.OFFLINE,         // validacion por firma sin ir a KC
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
    }),
  ],
  providers: [KeycloakAdminService],
  exports: [KeycloakConnectModule, KeycloakAdminService],
})
export class AuthModule {}
