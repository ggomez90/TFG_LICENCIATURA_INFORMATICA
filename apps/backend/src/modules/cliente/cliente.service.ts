import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Cliente, Usuario } from '@prisma/client';

import { CreateClienteDto } from './create-cliente.dto';
import { UpdateClienteDto } from './update-cliente.dto';
import { FilterClienteDto, FilterClienteAdminDto } from './filter-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(private readonly prisma: PrismaService) {}

  // Create para clientes (login requerido + controller)
  async create(dto: CreateClienteDto): Promise<Cliente> {
    try {
      return await this.prisma.cliente.create({
        data: { ...dto },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        // PK duplicada
        throw new BadRequestException('Ya existe un Cliente con ese idCliente.');
      }
      if (error?.code === 'P2003') {
        // FK invalida
        throw new BadRequestException('Alguna referencia es inválida (Provincia/Localidad/TipoCliente).');
      }
      throw error;
    }
  }

  // Listado completo solo para admin con FilterClienteDto y OrderDto
  async findAll(filter: FilterClienteDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy,
      order,
      idProvincia,
      idLocalidad,
      idTipoCliente,
      q, // busqueda por nombre/apellido/razon social (relacional con Usuario)
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
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip };
  }

  // leer por id para admin
  async findOne(idCliente: number): Promise<Cliente> {
    const found = await this.prisma.cliente.findUnique({
      where: { idCliente },
    });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    return found;
  }

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

  // Perfil propio (login requerido)
  async findMe(identifier: string): Promise<Cliente> {
    const usuario = await this.findUsuarioByIdentifier(identifier);

    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente: usuario.idUsuario },
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

  // Update por ADMIN
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

  //listado de usuarios de tipo cliente filtrados por tipoCliente
  async findAdminClientesFiltered(dto: FilterClienteAdminDto) {
    // paginacion normalizada, muestra de a 50 resultados por pagina
    const page = (dto as any).page ?? 1;
    const pageSize = (dto as any).pageSize ?? 50;
    const offset = (dto as any).offset ?? (page - 1) * pageSize;
    const limit = (dto as any).limit ?? pageSize;

    const {
      q,
      idEstadoUsuario,
      // tipoCliente viene SIEMPRE como string: 'todos', 'pendiente', '1', '2' o '3'
      tipoCliente = 'todos',
      sortBy = 'idUsuario',
      order = 'desc',
    } = dto;

    // WHERE base para usuarios rol CLIENTE (idRolUsuario = 3)
    const whereBase: any = {
      idRolUsuario: 3,
    };

    // Estado (opcional)
    if (typeof idEstadoUsuario === 'number') {
      whereBase.idEstadoUsuario = idEstadoUsuario;
    }

    // Busqueda libre (opcional)
    if (q && q.trim()) {
      const term = q.trim();
      whereBase.OR = [
        { usuario:   { contains: term, mode: 'insensitive' } },
        { email:     { contains: term, mode: 'insensitive' } },
        { nombres:   { contains: term, mode: 'insensitive' } },
        { apellidos: { contains: term, mode: 'insensitive' } },
        { dniCuitCuil: { contains: term, mode: 'insensitive' } },
      ];
    }

    // subfiltro de tipoCliente, si el parametro vino pendiente son los registros cuyo campo tipoCliente aun es NULL
    // todos va sin condicion y si es 1, 2 o 3 se transforma a numero ya que el campo en la bd es int
    if (tipoCliente === 'pendiente') {
      whereBase.cliente = { is: { idTipoCliente: null } };
    } else if (tipoCliente === '1' || tipoCliente === '2' || tipoCliente === '3') {
      whereBase.cliente = { is: { idTipoCliente: Number(tipoCliente) } };
    }

    // Conteo total
    const total = await this.prisma.usuario.count({
      where: whereBase,
    });

    // Items
    const items = await this.prisma.usuario.findMany({
      where: whereBase,
      include: {
        cliente: true, // para mostrar el tipoCliente en la grilla
      },
      orderBy: { [sortBy]: order },
      skip: offset,
      take: limit,
    });

    return {
      items,
      total,
      limit,
      offset,
      sortBy,
      order,
    };
  }
}
