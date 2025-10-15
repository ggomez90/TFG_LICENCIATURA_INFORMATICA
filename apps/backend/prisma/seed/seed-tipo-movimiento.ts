import { PrismaClient } from '@prisma/client';

export async function seedTipoMovimiento(prisma: PrismaClient) {
  await prisma.tipoMovimiento.createMany({
    data: [
      { idTipoMovimiento: 1, descripcion: 'CREDITO' },
      { idTipoMovimiento: 2, descripcion: 'DEBITO' },
    ],
    skipDuplicates: true,
  });
}
