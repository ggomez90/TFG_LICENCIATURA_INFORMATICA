import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KeycloakAdminService } from '../../auth/keycloak-admin.service';

import { CreateUsuarioDto } from './create-usuario.dto';
import { AdminCreateUsuarioDto } from './admin-create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { HabilitarUsuarioDto } from './enable-usuario.dto';
import { BanearUsuarioDto } from './ban-usuario.dto';
import { FilterUsuarioDto } from './filter-usuario.dto';

type AppRoleName = 'OPERARIO' | 'CLIENTE' | 'ADMINISTRADOR';

const ROL = {
  ADMINISTRADOR: 1,
  OPERARIO: 2,
  CLIENTE: 3,
} as const;

const ESTADO = {
  PENDIENTE: 1,
  HABILITADO: 2,
  BANEADO: 3,
} as const;

function roleNameFromId(id: number): AppRoleName {
  if (id === ROL.ADMINISTRADOR) return 'ADMINISTRADOR';
  if (id === ROL.OPERARIO) return 'OPERARIO';
  return 'CLIENTE';
}

@Injectable()
export class UsuarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kcAdmin: KeycloakAdminService,
  ) {}

  // Público
  async create(dto: CreateUsuarioDto) {
    return this.prisma.usuario.create({
      data: {
        nombres: dto.nombres?.trim() ?? '',
        apellidos: dto.apellidos?.trim() ?? '',
        dniCuitCuil: dto.dniCuitCuil ?? null,
        usuario: dto.usuario?.trim() ?? '',
        email: dto.email?.toLowerCase().trim() ?? '',
        idRolUsuario: (dto as any).idRolUsuario ?? ROL.CLIENTE,
        idEstadoUsuario: (dto as any).idEstadoUsuario ?? ESTADO.HABILITADO,
        motivoBan: (dto as any).motivoBan ?? null,
      },
    });
  }

  // Creacion por ADMIN
  async createByAdmin(dto: AdminCreateUsuarioDto) {
    const username = dto.usuario.trim();
    const email = dto.email.toLowerCase().trim();
    const firstName = dto.nombres.trim();
    const lastName = dto.apellidos.trim();
    const idRol = dto.idRolUsuario;

    //Crear usuario en Keycloak con acciones requeridas
    const { id: kcUserId } = await this.kcAdmin.createUser({
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: false,
      requiredActions: ['VERIFY_EMAIL', 'UPDATE_PASSWORD'],
    });

    //Asignar rol de realm en Keycloak
    const roleName = roleNameFromId(idRol);
    const realmRoleName = roleName === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : roleName; //realm del solicitante ADMINISTRADOR
    await this.kcAdmin.assignRealmRoleByUserId(kcUserId, realmRoleName);

    // 3)mail para ejecutar acciones (verificar email + setear contraseña)
    await this.kcAdmin.executeActionsEmail(kcUserId, ['VERIFY_EMAIL', 'UPDATE_PASSWORD']);

    //Crear en BD con estado PENDIENTE
    const created = await this.prisma.usuario.create({
      data: {
        nombres: firstName,
        apellidos: lastName,
        dniCuitCuil: dto.dniCuitCuil ?? null,
        usuario: username,
        email,
        idRolUsuario: idRol,
        idEstadoUsuario: ESTADO.PENDIENTE,
        motivoBan: null,
      },
    });

    return {
      ...created,
      kcUserId,
      info: 'Usuario creado. Debe verificar el email y establecer su contraseña desde el enlace enviado.',
    };
  }

  // Autenticado
  async meAndSync(kcUser: any) {
    // upsert en BD a partir del token de Keycloak
    const updated = await this.upsertFromKeycloakToken(kcUser);

    // Sin bloquear la respuesta: sincroniza rol a KC (fire-and-forget)
    this.syncRoleToKeycloak(kcUser, updated.idRolUsuario).catch((err) => {
      console.warn('[kc-sync] ensureUserHasRole fallo:', err?.message || err);
    });

    return updated;
  }

  async updateSelf(identifier: string, dto: UpdateUsuarioDto) {
    const current = await this.prisma.usuario.findFirst({
      where: { OR: [{ usuario: identifier }, { email: identifier }] },
    });
    if (!current) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.usuario.update({
      where: { idUsuario: current.idUsuario },
      data: {
        nombres: dto.nombres ?? current.nombres,
        apellidos: dto.apellidos ?? current.apellidos,
        dniCuitCuil: dto.dniCuitCuil ?? current.dniCuitCuil,
      },
    });
  }

  // ADMIN
  async findAll(_filter: FilterUsuarioDto) {
    return this.prisma.usuario.findMany({ orderBy: { idUsuario: 'asc' } });
  }

  async enable(id: number, dto: HabilitarUsuarioDto) {
    const estado = dto.idEstadoUsuario ?? ESTADO.HABILITADO;
    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { idEstadoUsuario: estado },
    });
  }

  async ban(id: number, dto: BanearUsuarioDto) {
    const motivo = (dto as any).motivoBan ?? 'Ban administrado';
    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { idEstadoUsuario: ESTADO.BANEADO, motivoBan: motivo },
    });
  }

  async update(id: number, dto: UpdateUsuarioDto, opts?: { asAdmin?: boolean }) {
    const current = await this.prisma.usuario.findUnique({ where: { idUsuario: id } });
    if (!current) throw new NotFoundException('Usuario no encontrado');

    const updated = await this.prisma.usuario.update({
      where: { idUsuario: id },
      data: {
        nombres: dto.nombres ?? current.nombres,
        apellidos: dto.apellidos ?? current.apellidos,
        dniCuitCuil: dto.dniCuitCuil ?? current.dniCuitCuil,
        idRolUsuario:
          typeof (dto as any).idRolUsuario === 'number'
            ? (dto as any).idRolUsuario
            : current.idRolUsuario,
        idEstadoUsuario:
          typeof (dto as any).idEstadoUsuario === 'number'
            ? (dto as any).idEstadoUsuario
            : current.idEstadoUsuario,
        motivoBan: (dto as any).motivoBan ?? current.motivoBan,
      },
    });

    if (opts?.asAdmin && updated.idRolUsuario !== current.idRolUsuario) {
      //diseñar pare resincronizar rol
    }

    return updated;
  }

  // Helpers
  private identifierFromKc(user: any): string {
    return (
      user?.preferred_username ??
      user?.email ??
      user?.username ??
      user?.sub ??
      ''
    ).toString();
  }

  private emailFromKc(user: any): string | null {
    const email = (user?.email ?? user?.preferred_username ?? '').toString().trim();
    return email ? email.toLowerCase() : null;
  }

  private async upsertFromKeycloakToken(kcUser: any) {
    const identifier = this.identifierFromKc(kcUser);
    const emailKC = this.emailFromKc(kcUser); // string o null

    const nombres = (kcUser?.given_name ?? '').toString().trim();
    const apellidos = (kcUser?.family_name ?? '').toString().trim();

    let existing = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          ...(emailKC ? [{ email: emailKC }] : []),
          { usuario: identifier },
        ],
      },
    });

    if (!existing) {
      existing = await this.prisma.usuario.create({
        data: {
          nombres,
          apellidos,
          dniCuitCuil: null,
          usuario: identifier,
          email: emailKC ?? '',
          idRolUsuario: ROL.CLIENTE,
          idEstadoUsuario: ESTADO.HABILITADO,
          motivoBan: null,
        },
      });
    } else {
      existing = await this.prisma.usuario.update({
        where: { idUsuario: existing.idUsuario },
        data: {
          nombres: nombres || existing.nombres,
          apellidos: apellidos || existing.apellidos,
          email: emailKC ?? existing.email,
        },
      });
    }

    return existing;
  }

  private async syncRoleToKeycloak(identity: any, idRolUsuario: number) {
    try {
      const username: string =
        identity?.preferred_username ||
        identity?.username ||
        identity?.email ||
        identity?.sub;

      const roleName =
        idRolUsuario === 1 ? 'ADMINISTRADOR' :
        idRolUsuario === 2 ? 'OPERARIO' :
        'CLIENTE';

      await this.kcAdmin.ensureUserHasRole(username, roleName);
    } catch (e) {
      // No frenar login si falla el Admin API
      console.warn('Error en sincronizacion de rol en KC:', (e as Error)?.message || e);
    }
  }
}
