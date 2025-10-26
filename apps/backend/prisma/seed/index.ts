import { PrismaClient } from '@prisma/client';

import { seedEstadoDesafio } from './seed-estado-desafio';
import { seedEstadoEntrega } from './seed-estado-entrega';
import { seedEstadoUsuario } from './seed-estado-usuario';
import { seedEstadoVoucher } from './seed-estado-voucher';
import { seedTipoMovimiento } from './seed-tipo-movimiento';
import { seedRolUsuario } from './seed-rol-usuario';
import { seedOrigenMovimiento } from './seed-origen-movimiento';
import { seedTipoCliente } from './seed-tipo-cliente';
import { seedProvincia } from './seed-provincia';
import { seedLocalidad } from './seed-localidad';

const prisma = new PrismaClient();

async function main() {
  await seedEstadoDesafio(prisma);
  await seedEstadoEntrega(prisma);
  await seedEstadoUsuario(prisma);
  await seedEstadoVoucher(prisma);
  await seedTipoMovimiento(prisma);
  await seedRolUsuario(prisma);
  await seedOrigenMovimiento(prisma);
  await seedTipoCliente(prisma);

  // Geográficos
  await seedProvincia(prisma);
  await seedLocalidad(prisma); // usa ids de Provincia
}

main()
  .then(async () => {
    console.log('✅ Seeds OK');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
