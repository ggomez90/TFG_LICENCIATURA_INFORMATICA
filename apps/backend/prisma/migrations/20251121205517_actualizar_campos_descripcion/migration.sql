-- AlterTable
ALTER TABLE `ContenidoEducativo` MODIFY `descripcion` VARCHAR(2000) NULL,
    MODIFY `urlRecurso` VARCHAR(300) NULL;

-- AlterTable
ALTER TABLE `Encuesta` MODIFY `titulo` VARCHAR(300) NOT NULL,
    MODIFY `descripcion` VARCHAR(5000) NOT NULL;

-- AlterTable
ALTER TABLE `VoucherTipo` MODIFY `titulo` VARCHAR(200) NOT NULL,
    MODIFY `descripcion` VARCHAR(500) NOT NULL;
