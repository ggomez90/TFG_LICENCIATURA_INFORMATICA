import { PrismaClient } from '@prisma/client';

export async function seedOrigenMovimiento(prisma: PrismaClient) {
  await prisma.origenMovimiento.createMany({
    data: [
      { idOrigenMovimiento: 1, descripcion: 'ENTREGA' },
      { idOrigenMovimiento: 2, descripcion: 'VOUCHER' },
      { idOrigenMovimiento: 3, descripcion: 'AJUSTE' },
    ],
    skipDuplicates: true,
  });
}
