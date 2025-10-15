import { PrismaClient } from '@prisma/client';

export async function seedEstadoVoucher(prisma: PrismaClient) {
  await prisma.estadoVoucher.createMany({
    data: [
      { idEstadoVoucher: 1, descripcion: 'CREADO' },
      { idEstadoVoucher: 2, descripcion: 'ADQUIRIDO' },
      { idEstadoVoucher: 3, descripcion: 'UTILIZADO' },
      { idEstadoVoucher: 4, descripcion: 'ANULADO' },
    ],
    skipDuplicates: true,
  });
}
