import { PrismaClient } from '@prisma/client';

export async function seedEstadoEntrega(prisma: PrismaClient) {
  await prisma.estadoEntrega.createMany({
    data: [
      { idEstadoEntrega: 1, descripcion: 'CREADA' },
      { idEstadoEntrega: 2, descripcion: 'PENDIENTE' },
      { idEstadoEntrega: 3, descripcion: 'VALIDADA' },
      { idEstadoEntrega: 4, descripcion: 'RECHAZADA' },
      { idEstadoEntrega: 5, descripcion: 'PUNTOS OTORGADOS' },
      { idEstadoEntrega: 6, descripcion: 'ANULADA' },
    ],
    skipDuplicates: true,
  });
}
