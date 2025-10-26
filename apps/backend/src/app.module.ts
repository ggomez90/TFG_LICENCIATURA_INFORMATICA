import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule, KeycloakAuthGuard, RolesGuard } from './auth';
import { UsuarioModule } from './modules/usuario/usuario.module';

@Module({
  imports: [
    // AuthModule registra y EXPORTA KeycloakConnectModule
    AuthModule,
    PrismaModule,
    UsuarioModule,
  ],
  controllers: [],
  providers: [
    // Guards globales personalizados
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
