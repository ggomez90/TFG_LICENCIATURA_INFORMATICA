import { Controller, Get } from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';

@Controller('secure')
export class SecureController {
  @Get('ping')
  ping() {
    return { ok: true, secure: true };
  }

  @Get('cliente')
  @Roles({ roles: ['realm:CLIENTE'] })
  onlyCliente() {
    return { ok: true, role: 'CLIENTE' };
  }

  @Get('operario')
  @Roles({ roles: ['realm:OPERARIO'] })
  onlyOperario() {
    return { ok: true, role: 'OPERARIO' };
  }

  @Get('admin')
  @Roles({ roles: ['realm:ADMINISTRADOR'] })
  onlyAdmin() {
    return { ok: true, role: 'ADMINISTRADOR' };
  }
}
