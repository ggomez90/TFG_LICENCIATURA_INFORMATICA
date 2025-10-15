import { PrismaClient } from '@prisma/client';

export async function seedTipoCliente(prisma: PrismaClient) {
  await prisma.tipoCliente.createMany({
    data: [
      { idTipoCliente: 1, descripcion: 'CIUDADANO' },
      { idTipoCliente: 2, descripcion: 'PYME/EMPRESA' },
      { idTipoCliente: 3, descripcion: 'INSTITUCION' },
    ],
    skipDuplicates: true,
  });
}
