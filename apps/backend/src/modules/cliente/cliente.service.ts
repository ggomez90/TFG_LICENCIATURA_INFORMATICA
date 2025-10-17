import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Cliente, Usuario } from '@prisma/client';

import { CreateClienteDto } from './create-cliente.dto';
import { UpdateClienteDto } from './update-cliente.dto';
import { FilterClienteDto } from './filter-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------
  // Create (login requerido – controller)
  // ---------------------------------------
  async create(dto: CreateClienteDto): Promise<Cliente> {
    try {
      // Si querés inicializar puntos en 0 siempre:
      // const data = { ...dto, puntos: dto.puntos ?? 0 };
      return await this.prisma.cliente.create({
        data: { ...dto },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        // PK duplicada, etc.
        throw new BadRequestException('Ya existe un Cliente con ese idCliente.');
      }
      if (error?.code === 'P2003') {
        // FK inválida (provincia, localidad, tipo)
        throw new BadRequestException('Alguna referencia es inválida (Provincia/Localidad/TipoCliente).');
      }
      throw error;
    }
  }

  // ---------------------------------------
  // List (solo ADMIN)
  // Confía en FilterClienteDto y OrderDto
  // ---------------------------------------
  async findAll(filter: FilterClienteDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy,
      order,
      idProvincia,
      idLocalidad,
      idTipoCliente,
      q, // búsqueda por nombre/apellido/razón social (relacional con Usuario)
    } = filter as any;

    const where: Prisma.ClienteWhereInput = {};

    if (idProvincia) where.idProvincia = Number(idProvincia);
    if (idLocalidad) where.idLocalidad = Number(idLocalidad);
    if (idTipoCliente) where.idTipoCliente = Number(idTipoCliente);

    if (q) {
      // Filtro por razonSocial y por nombres/apellidos del Usuario relacionado
      where.OR = [
        { razonSocial: { contains: q } },
        { usuario: { nombres: { contains: q } } as any },
        { usuario: { apellidos: { contains: q } } as any },
      ];
      // Nota: as any se usa si el tipo generado por Prisma no infiere el path relacional.
    }

    const sortField = (sortBy ?? 'idCliente') as keyof Prisma.ClienteOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.ClienteOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        skip,
        take,
        orderBy,
        // Si querés incluir datos del Usuario asociado:
        // include: { usuario: { select: { idUsuario: true, nombres: true, apellidos: true, email: true } } },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  // ---------------------------------------
  // Read por id (solo ADMIN)
  // ---------------------------------------
  async findOne(idCliente: number): Promise<Cliente> {
    const found = await this.prisma.cliente.findUnique({
      where: { idCliente },
      // include: { usuario: { select: { idUsuario: true, nombres: true, apellidos: true, email: true } } },
    });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    return found;
  }

  // ---------------------------------------
  // Helpers para ME: resolver idUsuario a idCliente
  // Busca Usuario por: id, usuario, email o dniCuitCuil
  // ---------------------------------------
  private async findUsuarioByIdentifier(idOrIdentifier: number | string): Promise<Usuario> {
    let usuario: Usuario | null = null;

    if (typeof idOrIdentifier === 'number' || /^\d+$/.test(String(idOrIdentifier))) {
      usuario = await this.prisma.usuario.findUnique({
        where: { idUsuario: Number(idOrIdentifier) },
      });
    } else {
      const identifier = String(idOrIdentifier).trim();
      usuario = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { usuario: identifier },
            { email: identifier },
            { dniCuitCuil: identifier },
          ],
        },
      });
    }

    if (!usuario) throw new NotFoundException('Usuario asociado no encontrado');
    return usuario;
  }

  // ---------------------------------------
  // Perfil propio (login requerido)
  // ---------------------------------------
  async findMe(identifier: string): Promise<Cliente> {
    const usuario = await this.findUsuarioByIdentifier(identifier);

    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente: usuario.idUsuario },
      // include: { usuario: { select: { idUsuario: true, nombres: true, apellidos: true, email: true } } },
    });

    if (!cliente) throw new NotFoundException('Cliente no encontrado para el usuario autenticado');
    return cliente;
  }

  async updateMe(identifier: string, dto: UpdateClienteDto): Promise<Cliente> {
    const usuario = await this.findUsuarioByIdentifier(identifier);

    const exists = await this.prisma.cliente.findUnique({
      where: { idCliente: usuario.idUsuario },
    });
    if (!exists) throw new NotFoundException('Cliente no encontrado para el usuario autenticado');

    try {
      return await this.prisma.cliente.update({
        where: { idCliente: usuario.idUsuario },
        data: { ...dto },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Provincia/Localidad/TipoCliente).');
      }
      throw error;
    }
  }

  // ---------------------------------------
  // Update por ADMIN
  // ---------------------------------------
  async update(idCliente: number, dto: UpdateClienteDto): Promise<Cliente> {
    const exists = await this.prisma.cliente.findUnique({ where: { idCliente } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');

    try {
      return await this.prisma.cliente.update({
        where: { idCliente },
        data: { ...dto },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Provincia/Localidad/TipoCliente).');
      }
      throw error;
    }
  }
}
