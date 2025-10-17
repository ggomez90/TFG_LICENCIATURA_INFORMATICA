import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Usuario } from '@prisma/client';

import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';
import { HabilitarUsuarioDto } from './enable-usuario.dto';
import { BanearUsuarioDto } from './ban-usuario.dto';
import { FilterUsuarioDto } from './filter-usuario.dto';

type UpdateContext = { asAdmin?: boolean };

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- Create público ----------------
  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    try {
      return await this.prisma.usuario.create({
        data: { ...dto },
      });
    } catch (error: any) {
      // Uniques: dniCuitCuil, usuario, email
      if (error?.code === 'P2002') {
        const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'dato único';
        throw new BadRequestException(`Ya existe un registro con el mismo ${target}.`);
      }
      throw error;
    }
  }

  // ---------------- List (solo ADMIN) ----------------
  async findAll(filter: FilterUsuarioDto) {
    const {
      limit = 20,
      offset = 0,
      // confiamos en OrderUsuarioDto: sortBy válido o undefined
      sortBy,
      order,
      query,
      idEstadoUsuario,
      idRolUsuario,
    } = filter as any;

    const where: Prisma.UsuarioWhereInput = {};

    if (query) {
      // MySQL con collation utf8mb4_unicode_ci suele ser case-insensitive
      where.OR = [
        { nombres:     { contains: query } },
        { apellidos:   { contains: query } },
        { usuario:     { contains: query } },
        { email:       { contains: query } },
        { dniCuitCuil: { contains: query } },
      ];
    }

    if (idEstadoUsuario !== undefined && idEstadoUsuario !== null) {
      where.idEstadoUsuario = Number(idEstadoUsuario);
    }

    if (idRolUsuario !== undefined && idRolUsuario !== null) {
      where.idRolUsuario = Number(idRolUsuario);
    }

    // Al confiar en el DTO, sortBy (si viene) ya es uno de:
    // 'idUsuario' | 'usuario' | 'email' | 'idRolUsuario' | 'idEstadoUsuario'
    const sortField = (sortBy ?? 'idUsuario') as keyof Prisma.UsuarioOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.UsuarioOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  // ---------------- Read (self/admin helpers) ----------------
  async findById(idOrIdentifier: number | string): Promise<Usuario> {
    let found: Usuario | null = null;

    if (typeof idOrIdentifier === 'number' || /^\d+$/.test(String(idOrIdentifier))) {
      found = await this.prisma.usuario.findUnique({
        where: { idUsuario: Number(idOrIdentifier) },
      });
    } else {
      const identifier = String(idOrIdentifier).trim();
      found = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { usuario: identifier },
            { email: identifier },
            { dniCuitCuil: identifier },
          ],
        },
      });
    }

    if (!found) throw new NotFoundException('Usuario no encontrado');
    return found;
  }

  // ---------------- Update por ADMIN ----------------
  async update(idUsuario: number, dto: UpdateUsuarioDto, _ctx?: UpdateContext): Promise<Usuario> {
    const exists = await this.prisma.usuario.findUnique({ where: { idUsuario } });
    if (!exists) throw new NotFoundException('Usuario no encontrado');

    try {
      return await this.prisma.usuario.update({
        where: { idUsuario },
        data: { ...dto },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'dato único';
        throw new BadRequestException(`Ya existe un registro con el mismo ${target}.`);
      }
      throw error;
    }
  }

  // ---------------- Update self (requiere login) ----------------
  async updateSelf(identifier: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    const me: Usuario = await this.findById(identifier);

    // Bloquear cambios sensibles en self-service (ajusta según tu política)
    const { idRolUsuario, idEstadoUsuario, ...safe } = dto as any;

    try {
      return await this.prisma.usuario.update({
        where: { idUsuario: me.idUsuario },
        data: { ...safe },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'dato único';
        throw new BadRequestException(`Ya existe un registro con el mismo ${target}.`);
      }
      throw error;
    }
  }

  // ---------------- Enable / Ban (solo ADMIN) ----------------
  async enable(idUsuario: number, dto: HabilitarUsuarioDto): Promise<Usuario> {
    const exists = await this.prisma.usuario.findUnique({ where: { idUsuario } });
    if (!exists) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.usuario.update({
      where: { idUsuario },
      data: { ...(dto as any) },
    });
  }

  async ban(idUsuario: number, dto: BanearUsuarioDto): Promise<Usuario> {
    const exists = await this.prisma.usuario.findUnique({ where: { idUsuario } });
    if (!exists) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.usuario.update({
      where: { idUsuario },
      data: { ...(dto as any) },
    });
  }
}
