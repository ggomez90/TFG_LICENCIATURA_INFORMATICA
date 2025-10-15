/*
  Warnings:

  - Added the required column `origen` to the `MovimientoPuntos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MovimientoPuntos` ADD COLUMN `origen` INTEGER NOT NULL,
    ALTER COLUMN `fecha` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `MovimientoPuntos_origen_idx` ON `MovimientoPuntos`(`origen`);

-- AddForeignKey
ALTER TABLE `MovimientoPuntos` ADD CONSTRAINT `MovimientoPuntos_origen_fkey` FOREIGN KEY (`origen`) REFERENCES `OrigenMovimiento`(`idOrigenMovimiento`) ON DELETE RESTRICT ON UPDATE CASCADE;
