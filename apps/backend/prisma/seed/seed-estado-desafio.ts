import { PrismaClient } from '@prisma/client';

export async function seedEstadoDesafio(prisma: PrismaClient) {
  await prisma.estadoDesafio.createMany({
    data: [
      { idEstadoDesafio: 1, descripcion: 'ACTIVO' },
      { idEstadoDesafio: 2, descripcion: 'PAUSADO' },
      { idEstadoDesafio: 3, descripcion: 'FINALIZADO' },
    ],
    skipDuplicates: true,
  });
}
