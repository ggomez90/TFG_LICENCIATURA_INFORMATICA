-- CreateTable
CREATE TABLE `EstadoDesafio` (
    `idEstadoDesafio` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idEstadoDesafio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoEntrega` (
    `idEstadoEntrega` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idEstadoEntrega`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoVoucher` (
    `idEstadoVoucher` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idEstadoVoucher`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoUsuario` (
    `idEstadoUsuario` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idEstadoUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoMovimiento` (
    `idTipoMovimiento` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idTipoMovimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolUsuario` (
    `idRolUsuario` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idRolUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrigenMovimiento` (
    `idOrigenMovimiento` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idOrigenMovimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoCliente` (
    `idTipoCliente` INTEGER NOT NULL,
    `descripcion` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idTipoCliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Provincia` (
    `idProvincia` INTEGER NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`idProvincia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Localidad` (
    `idLocalidad` INTEGER NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `idProvincia` INTEGER NOT NULL,

    PRIMARY KEY (`idLocalidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `idUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres` VARCHAR(100) NULL,
    `apellidos` VARCHAR(100) NULL,
    `dniCuitCuil` VARCHAR(20) NOT NULL,
    `usuario` VARCHAR(80) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `clave` VARCHAR(255) NOT NULL,
    `idRolUsuario` INTEGER NOT NULL,
    `idEstadoUsuario` INTEGER NOT NULL,

    UNIQUE INDEX `uq_doc`(`dniCuitCuil`),
    UNIQUE INDEX `uq_usuario`(`usuario`),
    UNIQUE INDEX `uq_email`(`email`),
    INDEX `Usuario_idRolUsuario_idx`(`idRolUsuario`),
    INDEX `Usuario_idEstadoUsuario_idx`(`idEstadoUsuario`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `idCliente` INTEGER NOT NULL,
    `razonSocial` VARCHAR(100) NULL,
    `direccion` VARCHAR(100) NOT NULL,
    `idProvincia` INTEGER NOT NULL,
    `idLocalidad` INTEGER NOT NULL,
    `idTipoCliente` INTEGER NULL,
    `puntos` INTEGER NOT NULL DEFAULT 0,

    INDEX `Cliente_idProvincia_idx`(`idProvincia`),
    INDEX `Cliente_idLocalidad_idx`(`idLocalidad`),
    INDEX `Cliente_idTipoCliente_idx`(`idTipoCliente`),
    PRIMARY KEY (`idCliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Voucher` (
    `idVoucher` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `idVoucherTipo` INTEGER NOT NULL,
    `estadoVoucher` INTEGER NOT NULL,
    `fechaAdquisicion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaUso` DATETIME(3) NULL,

    INDEX `Voucher_idCliente_idx`(`idCliente`),
    INDEX `Voucher_idVoucherTipo_idx`(`idVoucherTipo`),
    INDEX `Voucher_estadoVoucher_idx`(`estadoVoucher`),
    PRIMARY KEY (`idVoucher`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RespuestaEncuesta` (
    `idRespuesta` INTEGER NOT NULL AUTO_INCREMENT,
    `idEncuesta` INTEGER NOT NULL,
    `idUsuario` INTEGER NULL,
    `datosInvitado` VARCHAR(100) NULL,
    `dniCuilCuitInvitado` VARCHAR(20) NULL,
    `fechaRespuesta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contenido` VARCHAR(300) NOT NULL,

    INDEX `RespuestaEncuesta_idEncuesta_idx`(`idEncuesta`),
    INDEX `RespuestaEncuesta_idUsuario_idx`(`idUsuario`),
    PRIMARY KEY (`idRespuesta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InscripcionDesafio` (
    `idInscripcionDesafio` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `idDesafio` INTEGER NOT NULL,
    `fechaAdhesion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaBaja` DATETIME(3) NULL,
    `progreso` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `puntosAcumulados` INTEGER NOT NULL DEFAULT 0,
    `estado` INTEGER NOT NULL,

    INDEX `InscripcionDesafio_idCliente_idx`(`idCliente`),
    INDEX `InscripcionDesafio_idDesafio_idx`(`idDesafio`),
    INDEX `InscripcionDesafio_estado_idx`(`estado`),
    PRIMARY KEY (`idInscripcionDesafio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entrega` (
    `idEntrega` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `idDesafio` INTEGER NOT NULL,
    `idInscripcionDesafio` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaVencimiento` DATETIME(3) NOT NULL,
    `fechaValidacion` DATETIME(3) NULL,
    `cantidadDeclarada` DECIMAL(12, 3) NOT NULL,
    `cantidadVerificada` DECIMAL(12, 3) NULL,
    `estado` INTEGER NOT NULL,
    `observaciones` VARCHAR(300) NULL,
    `idOperarioValidador` INTEGER NULL,
    `motivoRechazo` VARCHAR(300) NULL,
    `ubicacion` VARCHAR(100) NULL,

    INDEX `Entrega_idCliente_idx`(`idCliente`),
    INDEX `Entrega_idDesafio_idx`(`idDesafio`),
    INDEX `Entrega_idInscripcionDesafio_idx`(`idInscripcionDesafio`),
    INDEX `Entrega_estado_idx`(`estado`),
    INDEX `Entrega_idOperarioValidador_idx`(`idOperarioValidador`),
    PRIMARY KEY (`idEntrega`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovimientoPuntos` (
    `idMovimiento` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` INTEGER NOT NULL,
    `puntos` INTEGER NOT NULL,
    `descripcion` VARCHAR(100) NULL,
    `idEntrega` INTEGER NULL,
    `idVoucher` INTEGER NULL,
    `idAdmin` INTEGER NULL,

    INDEX `MovimientoPuntos_idCliente_idx`(`idCliente`),
    INDEX `MovimientoPuntos_tipo_idx`(`tipo`),
    INDEX `MovimientoPuntos_idEntrega_idx`(`idEntrega`),
    INDEX `MovimientoPuntos_idVoucher_idx`(`idVoucher`),
    INDEX `MovimientoPuntos_idAdmin_idx`(`idAdmin`),
    PRIMARY KEY (`idMovimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContenidoEducativo` (
    `idContenidoEducativo` INTEGER NOT NULL AUTO_INCREMENT,
    `idAdmin` INTEGER NOT NULL,
    `titulo` VARCHAR(300) NULL,
    `descripcion` VARCHAR(500) NULL,
    `urlRecurso` VARCHAR(200) NULL,
    `fechaPublicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaBaja` DATETIME(3) NULL,
    `visible` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`idContenidoEducativo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VoucherTipo` (
    `idVoucherTipo` INTEGER NOT NULL AUTO_INCREMENT,
    `idAdmin` INTEGER NOT NULL,
    `titulo` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(200) NOT NULL,
    `puntosRequeridos` INTEGER NOT NULL,
    `montoBeneficio` INTEGER NOT NULL,
    `fechaInicioVigencia` DATETIME(3) NOT NULL,
    `fechaFinVigencia` DATETIME(3) NOT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`idVoucherTipo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Encuesta` (
    `idEncuesta` INTEGER NOT NULL AUTO_INCREMENT,
    `idAdmin` INTEGER NOT NULL,
    `titulo` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(500) NOT NULL,
    `fechaPublicacion` DATETIME(3) NOT NULL,
    `fechaCierre` DATETIME(3) NOT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`idEncuesta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacion` (
    `idNotificacion` INTEGER NOT NULL AUTO_INCREMENT,
    `idAdmin` INTEGER NOT NULL,
    `idRolUsuario` INTEGER NOT NULL,
    `titulo` VARCHAR(100) NOT NULL,
    `mensaje` VARCHAR(300) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `visible` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Notificacion_idRolUsuario_idx`(`idRolUsuario`),
    INDEX `Notificacion_idAdmin_idx`(`idAdmin`),
    PRIMARY KEY (`idNotificacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Desafio` (
    `idDesafio` INTEGER NOT NULL AUTO_INCREMENT,
    `idAdmin` INTEGER NOT NULL,
    `titulo` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(500) NOT NULL,
    `tipoResiduo` VARCHAR(100) NOT NULL,
    `requiereInscripcion` BOOLEAN NOT NULL DEFAULT false,
    `unidadMedida` VARCHAR(50) NOT NULL,
    `meta` DECIMAL(12, 3) NOT NULL,
    `puntosTotales` INTEGER NOT NULL,
    `puntosPorUnidad` DECIMAL(12, 3) NULL,
    `bonificacionDesafioCompleto` INTEGER NULL,
    `otorgaPuntosParcial` BOOLEAN NOT NULL DEFAULT false,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,
    `estado` INTEGER NOT NULL,
    `idRecursoEducativo` INTEGER NULL,

    INDEX `Desafio_idAdmin_idx`(`idAdmin`),
    INDEX `Desafio_estado_idx`(`estado`),
    INDEX `Desafio_idRecursoEducativo_idx`(`idRecursoEducativo`),
    PRIMARY KEY (`idDesafio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Localidad` ADD CONSTRAINT `Localidad_idProvincia_fkey` FOREIGN KEY (`idProvincia`) REFERENCES `Provincia`(`idProvincia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_idRolUsuario_fkey` FOREIGN KEY (`idRolUsuario`) REFERENCES `RolUsuario`(`idRolUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_idEstadoUsuario_fkey` FOREIGN KEY (`idEstadoUsuario`) REFERENCES `EstadoUsuario`(`idEstadoUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_idProvincia_fkey` FOREIGN KEY (`idProvincia`) REFERENCES `Provincia`(`idProvincia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_idLocalidad_fkey` FOREIGN KEY (`idLocalidad`) REFERENCES `Localidad`(`idLocalidad`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_idTipoCliente_fkey` FOREIGN KEY (`idTipoCliente`) REFERENCES `TipoCliente`(`idTipoCliente`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idCliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_idVoucherTipo_fkey` FOREIGN KEY (`idVoucherTipo`) REFERENCES `VoucherTipo`(`idVoucherTipo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_estadoVoucher_fkey` FOREIGN KEY (`estadoVoucher`) REFERENCES `EstadoVoucher`(`idEstadoVoucher`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestaEncuesta` ADD CONSTRAINT `RespuestaEncuesta_idEncuesta_fkey` FOREIGN KEY (`idEncuesta`) REFERENCES `Encuesta`(`idEncuesta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestaEncuesta` ADD CONSTRAINT `RespuestaEncuesta_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InscripcionDesafio` ADD CONSTRAINT `InscripcionDesafio_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idCliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InscripcionDesafio` ADD CONSTRAINT `InscripcionDesafio_idDesafio_fkey` FOREIGN KEY (`idDesafio`) REFERENCES `Desafio`(`idDesafio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InscripcionDesafio` ADD CONSTRAINT `InscripcionDesafio_estado_fkey` FOREIGN KEY (`estado`) REFERENCES `EstadoDesafio`(`idEstadoDesafio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idCliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_idDesafio_fkey` FOREIGN KEY (`idDesafio`) REFERENCES `Desafio`(`idDesafio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_idInscripcionDesafio_fkey` FOREIGN KEY (`idInscripcionDesafio`) REFERENCES `InscripcionDesafio`(`idInscripcionDesafio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_estado_fkey` FOREIGN KEY (`estado`) REFERENCES `EstadoEntrega`(`idEstadoEntrega`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_idOperarioValidador_fkey` FOREIGN KEY (`idOperarioValidador`) REFERENCES `Usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoPuntos` ADD CONSTRAINT `MovimientoPuntos_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idCliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoPuntos` ADD CONSTRAINT `MovimientoPuntos_tipo_fkey` FOREIGN KEY (`tipo`) REFERENCES `TipoMovimiento`(`idTipoMovimiento`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoPuntos` ADD CONSTRAINT `MovimientoPuntos_idEntrega_fkey` FOREIGN KEY (`idEntrega`) REFERENCES `Entrega`(`idEntrega`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoPuntos` ADD CONSTRAINT `MovimientoPuntos_idVoucher_fkey` FOREIGN KEY (`idVoucher`) REFERENCES `Voucher`(`idVoucher`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoPuntos` ADD CONSTRAINT `MovimientoPuntos_idAdmin_fkey` FOREIGN KEY (`idAdmin`) REFERENCES `Usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContenidoEducativo` ADD CONSTRAINT `ContenidoEducativo_idAdmin_fkey` FOREIGN KEY (`idAdmin`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VoucherTipo` ADD CONSTRAINT `VoucherTipo_idAdmin_fkey` FOREIGN KEY (`idAdmin`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Encuesta` ADD CONSTRAINT `Encuesta_idAdmin_fkey` FOREIGN KEY (`idAdmin`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_idAdmin_fkey` FOREIGN KEY (`idAdmin`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_idRolUsuario_fkey` FOREIGN KEY (`idRolUsuario`) REFERENCES `RolUsuario`(`idRolUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Desafio` ADD CONSTRAINT `Desafio_idAdmin_fkey` FOREIGN KEY (`idAdmin`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Desafio` ADD CONSTRAINT `Desafio_estado_fkey` FOREIGN KEY (`estado`) REFERENCES `EstadoDesafio`(`idEstadoDesafio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Desafio` ADD CONSTRAINT `Desafio_idRecursoEducativo_fkey` FOREIGN KEY (`idRecursoEducativo`) REFERENCES `ContenidoEducativo`(`idContenidoEducativo`) ON DELETE SET NULL ON UPDATE CASCADE;
