import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule, KeycloakAuthGuard, RolesGuard } from './auth';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { ContenidoModule } from './modules/contenido/contenido.module';
import { EncuestaModule } from './modules/encuesta/encuesta.module';
import { ClienteModule } from './modules/cliente';
import { DesafioModule } from './modules/desafio';
import { VoucherTipoModule } from './modules/voucher-tipo';
import { VoucherModule } from './modules/voucher';
import { LocalidadModule } from './modules/localidad';
import { ProvinciaModule } from './modules/provincia';
import { EntregaModule } from './modules/entrega';
import { RespuestaModule } from './modules/respuesta';
import { InscripcionModule } from './modules/inscripcion';
import { MovimientosModule } from './modules/movimientos';
import { NotificacionModule } from './modules/notificacion';
import { UsuarioNotificacionMetaModule } from './modules/usuario-notificacion-meta/usuario-notificacion-meta.module';

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
    VoucherTipoModule,
    VoucherModule,
    LocalidadModule,
    ProvinciaModule,
    EntregaModule,
    RespuestaModule,
    InscripcionModule,
    MovimientosModule,
    NotificacionModule,
    UsuarioNotificacionMetaModule
  ],
  controllers: [],
  providers: [
    // Guards globales personalizados
    { provide: APP_GUARD, useClass: KeycloakAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
