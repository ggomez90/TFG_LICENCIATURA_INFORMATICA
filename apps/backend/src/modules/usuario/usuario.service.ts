import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KeycloakAdminService } from '../../auth/keycloak-admin.service';

import { CreateUsuarioDto } from './create-usuario.dto';
import { AdminCreateUsuarioDto } from './admin-create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { HabilitarUsuarioDto } from './enable-usuario.dto';
import { BanearUsuarioDto } from './ban-usuario.dto';
import { FilterUsuarioDto } from './filter-usuario.dto';
import { Prisma } from '@prisma/client';

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

// Defaults para Cliente cuando el usuario es CLIENTE
const DEFAULT_CLIENTE = {
  direccion: ' ',     // un espacio
  idProvincia: 21,    // Santa Fe
  idLocalidad: 210064 // Ceres
  // idTipoCliente: null por defecto
  // puntos: 0 por defecto (lo aplica Prisma)
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

  // Crear publico para usuarios que se dan de alta desde el home login
  async create(dto: CreateUsuarioDto) {
    const created = await this.prisma.usuario.create({
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

    // asigna cliente por default
    if (created.idRolUsuario === ROL.CLIENTE) {
      await this.ensureClienteForUser(created.idUsuario);
    }

    return created;
  }


  // Creacion por ADMIN
  async createByAdmin(dto: AdminCreateUsuarioDto) {
    const username = dto.usuario.trim();
    if (username.length < 6 || username.length > 80) {
      throw new BadRequestException('El usuario debe tener entre 6 y 80 caracteres');
    }
    const email = dto.email.toLowerCase().trim();
    const firstName = dto.nombres.trim();
    const lastName = dto.apellidos.trim();
    const idRol = dto.idRolUsuario;

    try {
      // Crea en Keycloak con acciones requeridas
      const { id: kcUserId } = await this.kcAdmin.createUser({
        username,
        email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: false,
        requiredActions: ['VERIFY_EMAIL', 'UPDATE_PASSWORD'],
      });

      // Asigna rol realm en Keycloak
      const roleName = roleNameFromId(idRol);
      const realmRoleName = roleName === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : roleName;
      await this.kcAdmin.assignRealmRoleByUserId(kcUserId, realmRoleName);

      // Email para ejecutar acciones (verificar email + setear contraseña)
      await this.kcAdmin.executeActionsEmail(kcUserId, ['VERIFY_EMAIL', 'UPDATE_PASSWORD']);

      // Crear en BD con estado PENDIENTE
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

      // si es CLIENTE, asegurar fila en Cliente
      if (created.idRolUsuario === ROL.CLIENTE) {
        await this.ensureClienteForUser(created.idUsuario);
      }

      return {
        ...created,
        kcUserId,
        info: 'Usuario creado. Debe verificar el email y establecer su contraseña desde el enlace enviado.',
      };
    } catch (e) {
      const friendly = this.mapCreateAdminConflict(e);
      if (friendly) {
        // 409 con mensaje claro
        throw new ConflictException(friendly);
      }
      throw e;
    }
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

  // Listado completo para admin con filtros
  async findAll(filter: FilterUsuarioDto) {
    const {
      limit,
      offset,
      sortBy = 'idUsuario',
      order = 'desc',

      q,
      email,
      idRolUsuario,
      idEstadoUsuario,

      tipo,         // 'admin' | 'operario' | 'cliente' | 'todos'
      tipoCliente,  // 'todos' | 'pendiente' | '1' | '2' | '3'
    } = filter as any;

    const where: Prisma.UsuarioWhereInput = {};

    // filtros basicos
    if (email) where.email = email;
    if (idRolUsuario) where.idRolUsuario = Number(idRolUsuario);
    if (idEstadoUsuario) where.idEstadoUsuario = Number(idEstadoUsuario);

    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [
        { usuario:     { contains: term } },
        { email:       { contains: term } },
        { nombres:     { contains: term } },
        { apellidos:   { contains: term } },
        { dniCuitCuil: { contains: term } as any },
      ];
    }

    // filtros por rol y tipo de cliente en caso de rol cliente, seran select en front para evitar tipeo
    const and: Prisma.UsuarioWhereInput[] = [];

    if (tipo === 'admin') and.push({ idRolUsuario: 1 });
    else if (tipo === 'operario') and.push({ idRolUsuario: 2 });
    else if (tipo === 'cliente') {
      and.push({ idRolUsuario: 3 });

      if (tipoCliente && tipoCliente !== 'todos') {
        if (tipoCliente === 'pendiente') {
          // Pendiente = (sin fila en Cliente) OR (con fila y idTipoCliente NULL)
          and.push({
            OR: [
              { cliente: { is: null } },                          // sin fila asociada
              { cliente: { is: { idTipoCliente: null } } },       // fila con tipo null
            ],
          });
        } else if (tipoCliente === '1' || tipoCliente === '2' || tipoCliente === '3') {
          // Asegurá que exista la fila de Cliente y que el idTipoCliente coincida
          and.push({
            cliente: {
              is: {
                idTipoCliente: { equals: Number(tipoCliente) },
              },
            },
          });
        }
      }
    }
    if (and.length) {
      if (where.AND) (where.AND as any[]).push(...and);
      else where.AND = and;
    }

    // orden
    const sortField = String(sortBy) as keyof Prisma.UsuarioOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.UsuarioOrderByWithRelationInput = { [sortField]: sortOrder };

    // incluir relación sólo si hace falta
    const include =
      (tipo === 'cliente' || (tipoCliente && tipoCliente !== 'todos'))
        ? { cliente: { select: { idTipoCliente: true } } }
        : undefined;

    // MODO LISTA PLANA: preserva /usuarios para contadores
    if (limit === undefined && offset === undefined) {
      return this.prisma.usuario.findMany({ where, orderBy, include });
    }

    // MODO PAGINADO
    const take = Number(limit ?? 50);
    const skip = Number(offset ?? 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({ where, skip, take, orderBy, include }),
      this.prisma.usuario.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip, sortBy: sortField, order: sortOrder };
  }


  //ban de usuario con id de usuario y msj por default por si no se coloca nada
  async ban(id: number, dto: BanearUsuarioDto) {
    const motivo = dto.motivo?.toString().trim() || 'Ban administrado';
    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: {
        idEstadoUsuario: ESTADO.BANEADO,
        motivoBan: motivo,
      },
    });
  }

  // unBan, se pasa a HABILITADO y motivoBan a  NULL
  async enable(id: number, dto: HabilitarUsuarioDto) {
    const estado = dto.idEstadoUsuario ?? ESTADO.HABILITADO;

    // limpiar el motivo
    const data: any = { idEstadoUsuario: estado };
    if (estado === ESTADO.HABILITADO) {
      data.motivoBan = null;
    }

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data,
    });
  }

  // actualizar con parametro id
  async update(id: number, dto: UpdateUsuarioDto, opts?: { asAdmin?: boolean }) {
    const current = await this.prisma.usuario.findUnique({ where: { idUsuario: id } });
    if (!current) throw new NotFoundException('Usuario no encontrado');

    const newRol =
      typeof (dto as any).idRolUsuario === 'number'
        ? (dto as any).idRolUsuario
        : current.idRolUsuario;

    const newEstado =
      typeof (dto as any).idEstadoUsuario === 'number'
        ? (dto as any).idEstadoUsuario
        : current.idEstadoUsuario;

    const updated = await this.prisma.usuario.update({
      where: { idUsuario: id },
      data: {
        nombres: dto.nombres ?? current.nombres,
        apellidos: dto.apellidos ?? current.apellidos,
        dniCuitCuil: dto.dniCuitCuil ?? current.dniCuitCuil,
        idRolUsuario: newRol,
        idEstadoUsuario: newEstado,
        motivoBan: (dto as any).motivoBan ?? current.motivoBan,
      },
    });

    // Si cambió el rol y ahora es CLIENTE hay asegurar fila en Cliente
    if (updated.idRolUsuario !== current.idRolUsuario && updated.idRolUsuario === ROL.CLIENTE) {
      await this.ensureClienteForUser(updated.idUsuario);
    }

    // Si se actualiza como admin y cambió el rol hay intentar resincronizar en KC (no bloqueante)
    if (opts?.asAdmin && updated.idRolUsuario !== current.idRolUsuario) {
      try {
        const roleName =
          updated.idRolUsuario === ROL.ADMINISTRADOR ? 'ADMINISTRADOR' :
          updated.idRolUsuario === ROL.OPERARIO ? 'OPERARIO' :
          'CLIENTE';

        // usa el username local (current.usuario) para asegurar el rol en KC
        await this.kcAdmin.ensureUserHasRole(current.usuario, roleName);
      } catch (e) {
        console.warn('[kc-sync] ensureUserHasRole (update) fallo:', (e as Error)?.message || e);
      }
    }

    return updated;
  }


  // Helpers/funciones
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

      // si es CLIENTE, asegurar fila en Cliente
      if (existing.idRolUsuario === ROL.CLIENTE) {
        await this.ensureClienteForUser(existing.idUsuario);
      }
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

  // Helpers para mapear errores de duplicados a 409 con mensaje claro
  private mapCreateAdminConflict(e: unknown): string | null {
    // Prisma unique constraint (dni/email/usuario)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const t = (e.meta?.target as unknown) ?? '';
      const target = Array.isArray(t) ? t.join(',') : String(t);

      if (target.includes('uq_doc') || target.includes('dniCuitCuil')) {
        return 'El DNI/CUIT/CUIL ya está registrado.';
      }
      if (target.includes('uq_email') || target.includes('email')) {
        return 'El email ya está registrado.';
      }
      if (target.includes('uq_usuario') || target.includes('usuario')) {
        return 'El nombre de usuario ya está registrado.';
      }
      return 'Ya existe un registro con esos datos (campo único duplicado).';
    }

    // Keycloak 409 (usuario/email duplicados)
    if (e instanceof Error) {
      const msg = e.message.toLowerCase();
      if (msg.includes('user exists with same email')) {
        return 'El email ya está registrado.';
      }
      if (msg.includes('user exists with same username')) {
        return 'El nombre de usuario ya está registrado.';
      }
    }

    return null;
  }

  private async ensureClienteForUser(idUsuario: number): Promise<void> {
    // ver si existe
    const exists = await this.prisma.cliente.findUnique({
      where: { idCliente: idUsuario },
      select: { idCliente: true },
    });
    if (exists) return;

    // Crear con defaults
    try {
      await this.prisma.cliente.create({
        data: {
          idCliente: idUsuario,                 // PK = FK a Usuario
          direccion: DEFAULT_CLIENTE.direccion, // ' '
          idProvincia: DEFAULT_CLIENTE.idProvincia,
          idLocalidad: DEFAULT_CLIENTE.idLocalidad,
          // idTipoCliente: null
          // puntos en 0
        },
      });
    } catch (e: any) {
      // Si la PK ya existe por race condition se ignora
      if (e?.code === 'P2002') return;
      throw e;
    }
  }
}
