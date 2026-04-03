-- CreateTable
CREATE TABLE `UsuarioNotificacionMeta` (
    `idUsuarioNotificacionMeta` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `ultimaNotificacionVistaAt` DATETIME(3) NULL,

    UNIQUE INDEX `UsuarioNotificacionMeta_idUsuario_key`(`idUsuario`),
    INDEX `UsuarioNotificacionMeta_ultimaNotificacionVistaAt_idx`(`ultimaNotificacionVistaAt`),
    PRIMARY KEY (`idUsuarioNotificacionMeta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UsuarioNotificacionMeta` ADD CONSTRAINT `UsuarioNotificacionMeta_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;
