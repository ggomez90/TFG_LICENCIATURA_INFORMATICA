import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocalidadDto } from './localidad.dto';
import { UpdateLocalidadDto } from './localidad.dto';
import { FilterLocalidadDto } from './localidad.dto';

@Injectable()
export class LocalidadService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterLocalidadDto) {
    const {
      q,
      idProvincia,
      page = 1,
      pageSize = 50,
      order = 'ASC',
      sortBy = 'nombre',
    } = filter;

    const where: any = {};
    if (q) {
      where.nombre = { contains: q, mode: 'insensitive' };
    }
    if (idProvincia) {
      where.idProvincia = Number(idProvincia);
    }

    const validSort = ['idLocalidad', 'nombre', 'idProvincia'];
    const sortField = validSort.includes(sortBy) ? sortBy : 'nombre';
    const sortOrder = order === 'DESC' ? 'desc' : 'asc';

    const [total, data] = await Promise.all([
      this.prisma.localidad.count({ where }),
      this.prisma.localidad.findMany({
        where,
        include: {
          provincia: { select: { idProvincia: true, nombre: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        sortBy: sortField,
        order: sortOrder.toUpperCase(),
      },
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.localidad.findUnique({
      where: { idLocalidad: id },
      include: { provincia: { select: { idProvincia: true, nombre: true } } },
    });
    if (!item) throw new NotFoundException('Localidad no encontrada');
    return item;
  }

  async create(dto: CreateLocalidadDto) {
    // asume validacion de unicidad (nombre + provincia) 
    return this.prisma.localidad.create({
      data: {
        idLocalidad: dto.idLocalidad,
        nombre: dto.nombre,
        idProvincia: dto.idProvincia,
      },
    });
  }

  async update(id: number, dto: UpdateLocalidadDto) {
    await this.ensureExists(id);
    return this.prisma.localidad.update({
      where: { idLocalidad: id },
      data: {
        nombre: dto.nombre ?? undefined,
        idProvincia: dto.idProvincia ?? undefined,
      },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    return this.prisma.localidad.delete({ where: { idLocalidad: id } });
  }

  private async ensureExists(id: number) {
    const found = await this.prisma.localidad.findUnique({ where: { idLocalidad: id } });
    if (!found) throw new NotFoundException('Localidad no encontrada');
  }
}
