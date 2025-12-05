import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule, KeycloakAuthGuard, RolesGuard } from './auth';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { ContenidoModule } from './modules/contenido/contenido.module';
import { EncuestaModule } from './modules/encuesta/encuesta.module';
import { ClienteModule } from './modules/cliente';
import { DesafioModule } from './modules/desafio';

@Module({
  imports: [
    // el AuthModule ya registra y exporta KeycloakConnectModule
    AuthModule,
    PrismaModule,
    UsuarioModule,
    ContenidoModule,
    EncuestaModule,
    ClienteModule,
    DesafioModule,
  ],
  controllers: [],
  providers: [
    // Guards globales personalizados
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
