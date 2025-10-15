import { PrismaClient } from '@prisma/client';

const PROVINCIAS = [
  'BUENOS AIRES',
  'CIUDAD AUTONOMA DE BUENOS AIRES',
  'CATAMARCA',
  'CHACO',
  'CHUBUT',
  'CORDOBA',
  'CORRIENTES',
  'ENTRE RIOS',
  'FORMOSA',
  'JUJUY',
  'LA PAMPA',
  'LA RIOJA',
  'MENDOZA',
  'MISIONES',
  'NEUQUEN',
  'RIO NEGRO',
  'SALTA',
  'SAN JUAN',
  'SAN LUIS',
  'SANTA CRUZ',
  'SANTA FE',
  'SANTIAGO DEL ESTERO',
  'TIERRA DEL FUEGO',
  'TUCUMAN',
] as const;

export async function seedProvincia(prisma: PrismaClient) {
  await prisma.provincia.createMany({
    data: PROVINCIAS.map((nombre, idx) => ({
      idProvincia: idx + 1,
      nombre,
    })),
    skipDuplicates: true,
  });
}
