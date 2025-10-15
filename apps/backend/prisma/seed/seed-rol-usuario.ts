import { PrismaClient } from '@prisma/client';

export async function seedRolUsuario(prisma: PrismaClient) {
  await prisma.rolUsuario.createMany({
    data: [
      { idRolUsuario: 1, descripcion: 'ADMINISTRADOR' },
      { idRolUsuario: 2, descripcion: 'OPERARIO' },
      { idRolUsuario: 3, descripcion: 'CLIENTE' },
    ],
    skipDuplicates: true,
  });
}
