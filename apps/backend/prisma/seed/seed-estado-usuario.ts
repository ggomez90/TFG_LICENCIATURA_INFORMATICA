import { PrismaClient } from '@prisma/client';

export async function seedEstadoUsuario(prisma: PrismaClient) {
  await prisma.estadoUsuario.createMany({
    data: [
      { idEstadoUsuario: 1, descripcion: 'PENDIENTE' },
      { idEstadoUsuario: 2, descripcion: 'HABILITADO' },
      { idEstadoUsuario: 3, descripcion: 'BANEADO' },
    ],
    skipDuplicates: true,
  });
}