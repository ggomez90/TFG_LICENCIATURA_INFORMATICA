import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterProvinciaDto } from './provincia.dto';

@Injectable()
export class ProvinciaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: FilterProvinciaDto) {
    const {
      q,
      page = 1,
      pageSize = 50,
      order = 'ASC', // hereda de OrderDto si así lo definiste
      sortBy = 'nombre',
    } = dto;

    const where = q
      ? {
          nombre: {
            contains: q,
            mode: 'insensitive' as const,
          },
        }
      : {};

    // Sólo permitimos ordenar por campos conocidos. Por simplicidad: nombre o idProvincia
    const safeSort = ['nombre', 'idProvincia'].includes(sortBy) ? sortBy : 'nombre';
    const direction = order === 'DESC' ? 'desc' : 'asc';

    const [total, data] = await this.prisma.$transaction([
      this.prisma.provincia.count({ where }),
      this.prisma.provincia.findMany({
        where,
        orderBy: { [safeSort]: direction },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          idProvincia: true,
          nombre: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(idProvincia: number) {
    const prov = await this.prisma.provincia.findUnique({
      where: { idProvincia },
      select: {
        idProvincia: true,
        nombre: true,
      },
    });

    if (!prov) {
      throw new NotFoundException('Provincia no encontrada');
    }
    return prov;
  }
}
