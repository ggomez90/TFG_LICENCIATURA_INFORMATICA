import { Module } from '@nestjs/common';
import {
  KeycloakConnectModule,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';
import { KeycloakAdminService } from './keycloak-admin.service';
import { KeycloakAuthGuard } from './keycloak.guard';
import { PrismaService } from '../prisma/prisma.service';

const REALM = process.env.KEYCLOAK_REALM || 'yo-reciclo';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'api-yo-reciclo';
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';
const REALM_PUBKEY = process.env.KEYCLOAK_REALM_PUBLIC_KEY;

const PUBLIC_AUTH_SERVER_URL = 'http://localhost:8081';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: PUBLIC_AUTH_SERVER_URL,
      realm: REALM,
      clientId: CLIENT_ID,
      secret: CLIENT_SECRET,
      realmPublicKey: REALM_PUBKEY,
      tokenValidation: TokenValidation.OFFLINE,
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
    }),
  ],
  providers: [
    PrismaService,
    KeycloakAdminService,
    KeycloakAuthGuard,
  ],
  exports: [
    KeycloakConnectModule,
    KeycloakAdminService,
    KeycloakAuthGuard,
  ],
})
export class AuthModule {}
