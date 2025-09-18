-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: yo_reciclo
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contenido_educativo`
--

DROP TABLE IF EXISTS `contenido_educativo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contenido_educativo` (
  `idContenidoEducativo` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `urlRecurso` varchar(500) DEFAULT NULL,
  `fechaPublicacion` datetime NOT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT '1',
  `creadoPor` int NOT NULL,
  PRIMARY KEY (`idContenidoEducativo`),
  KEY `fk_contenido_creador` (`creadoPor`),
  CONSTRAINT `fk_contenido_creador` FOREIGN KEY (`creadoPor`) REFERENCES `usuario` (`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contenido_educativo`
--

LOCK TABLES `contenido_educativo` WRITE;
/*!40000 ALTER TABLE `contenido_educativo` DISABLE KEYS */;
/*!40000 ALTER TABLE `contenido_educativo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `desafio`
--

DROP TABLE IF EXISTS `desafio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `desafio` (
  `idDesafio` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `tipoResiduo` varchar(80) NOT NULL,
  `requiereInscripcion` tinyint(1) NOT NULL DEFAULT '0',
  `unidadMedida` varchar(20) NOT NULL,
  `meta` decimal(12,3) NOT NULL,
  `puntosTotales` int NOT NULL,
  `puntosPorUnidad` decimal(12,3) NOT NULL,
  `bonificacionCompleto` int DEFAULT NULL,
  `puntosParcial` tinyint(1) NOT NULL DEFAULT '0',
  `fechaInicio` datetime NOT NULL,
  `fechaFin` datetime NOT NULL,
  `estado` varchar(30) NOT NULL,
  `idContenidoEducativo` int DEFAULT NULL,
  PRIMARY KEY (`idDesafio`),
  KEY `fk_desafio_contenido` (`idContenidoEducativo`),
  CONSTRAINT `fk_desafio_contenido` FOREIGN KEY (`idContenidoEducativo`) REFERENCES `contenido_educativo` (`idContenidoEducativo`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `desafio`
--

LOCK TABLES `desafio` WRITE;
/*!40000 ALTER TABLE `desafio` DISABLE KEYS */;
/*!40000 ALTER TABLE `desafio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encuesta`
--

DROP TABLE IF EXISTS `encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encuesta` (
  `idEncuesta` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT '0',
  `fechaPublicacion` datetime DEFAULT NULL,
  `fechaCierre` datetime DEFAULT NULL,
  `creadaPor` int NOT NULL,
  PRIMARY KEY (`idEncuesta`),
  KEY `fk_encuesta_admin` (`creadaPor`),
  CONSTRAINT `fk_encuesta_admin` FOREIGN KEY (`creadaPor`) REFERENCES `usuario` (`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encuesta`
--

LOCK TABLES `encuesta` WRITE;
/*!40000 ALTER TABLE `encuesta` DISABLE KEYS */;
/*!40000 ALTER TABLE `encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrega`
--

DROP TABLE IF EXISTS `entrega`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrega` (
  `idEntrega` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `idDesafio` int NOT NULL,
  `fecha` datetime NOT NULL,
  `cantidadDeclarada` decimal(12,3) NOT NULL,
  `cantidadVerificada` decimal(12,3) DEFAULT NULL,
  `estado` varchar(30) NOT NULL,
  `observaciones` varchar(300) DEFAULT NULL,
  `idOperarioValidador` int DEFAULT NULL,
  `fechaValidacion` datetime DEFAULT NULL,
  `motivoRechazo` varchar(200) DEFAULT NULL,
  `ubicacion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`idEntrega`),
  KEY `idx_entrega_usuario` (`idUsuario`),
  KEY `idx_entrega_desafio` (`idDesafio`),
  KEY `fk_entrega_operario` (`idOperarioValidador`),
  KEY `idx_entrega_estado` (`estado`),
  CONSTRAINT `fk_entrega_desafio` FOREIGN KEY (`idDesafio`) REFERENCES `desafio` (`idDesafio`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_entrega_operario` FOREIGN KEY (`idOperarioValidador`) REFERENCES `usuario` (`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_entrega_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrega`
--

LOCK TABLES `entrega` WRITE;
/*!40000 ALTER TABLE `entrega` DISABLE KEYS */;
/*!40000 ALTER TABLE `entrega` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripcion_desafio`
--

DROP TABLE IF EXISTS `inscripcion_desafio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripcion_desafio` (
  `idInscripcion` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `idDesafio` int NOT NULL,
  `fechaAdhesion` date NOT NULL,
  `fechaBaja` date DEFAULT NULL,
  `progresoPorc` decimal(5,2) NOT NULL DEFAULT '0.00',
  `puntosAcumulados` int NOT NULL DEFAULT '0',
  `estado` varchar(30) NOT NULL,
  PRIMARY KEY (`idInscripcion`),
  UNIQUE KEY `uq_insc_usuario_desafio` (`idUsuario`,`idDesafio`),
  KEY `idx_insc_desafio` (`idDesafio`),
  CONSTRAINT `fk_insc_desafio` FOREIGN KEY (`idDesafio`) REFERENCES `desafio` (`idDesafio`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_insc_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripcion_desafio`
--

LOCK TABLES `inscripcion_desafio` WRITE;
/*!40000 ALTER TABLE `inscripcion_desafio` DISABLE KEYS */;
/*!40000 ALTER TABLE `inscripcion_desafio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_puntos`
--

DROP TABLE IF EXISTS `movimiento_puntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_puntos` (
  `idMovimiento` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` varchar(20) NOT NULL,
  `origen` varchar(20) NOT NULL,
  `puntos` int NOT NULL,
  `descripcion` varchar(200) NOT NULL,
  `idEntrega` int DEFAULT NULL,
  `idVoucher` int DEFAULT NULL,
  `idAdminAjuste` int DEFAULT NULL,
  PRIMARY KEY (`idMovimiento`),
  KEY `idx_mov_usuario` (`idUsuario`),
  KEY `idx_mov_origen` (`origen`),
  KEY `fk_mov_entrega` (`idEntrega`),
  KEY `fk_mov_voucher` (`idVoucher`),
  KEY `fk_mov_admin` (`idAdminAjuste`),
  KEY `idx_mov_usuario_fecha` (`idUsuario`,`fecha`),
  CONSTRAINT `fk_mov_admin` FOREIGN KEY (`idAdminAjuste`) REFERENCES `usuario` (`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_entrega` FOREIGN KEY (`idEntrega`) REFERENCES `entrega` (`idEntrega`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mov_voucher` FOREIGN KEY (`idVoucher`) REFERENCES `voucher` (`idVoucher`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_puntos`
--

LOCK TABLES `movimiento_puntos` WRITE;
/*!40000 ALTER TABLE `movimiento_puntos` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimiento_puntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `idNotificacion` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creadaPor` int NOT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idNotificacion`),
  KEY `fk_notif_admin` (`creadaPor`),
  CONSTRAINT `fk_notif_admin` FOREIGN KEY (`creadaPor`) REFERENCES `usuario` (`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `respuesta_encuesta`
--

DROP TABLE IF EXISTS `respuesta_encuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `respuesta_encuesta` (
  `idRespuesta` int NOT NULL AUTO_INCREMENT,
  `idEncuesta` int NOT NULL,
  `idUsuario` int DEFAULT NULL,
  `nombreApellidoInv` varchar(150) DEFAULT NULL,
  `dniCuilCuitInv` varchar(20) DEFAULT NULL,
  `fechaRespuesta` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `contenido` text NOT NULL,
  PRIMARY KEY (`idRespuesta`),
  KEY `idx_resp_encuesta` (`idEncuesta`),
  KEY `idx_resp_usuario` (`idUsuario`),
  CONSTRAINT `fk_resp_encuesta` FOREIGN KEY (`idEncuesta`) REFERENCES `encuesta` (`idEncuesta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resp_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `respuesta_encuesta`
--

LOCK TABLES `respuesta_encuesta` WRITE;
/*!40000 ALTER TABLE `respuesta_encuesta` DISABLE KEYS */;
/*!40000 ALTER TABLE `respuesta_encuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `nombres` varchar(100) DEFAULT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `razonSocial` varchar(150) DEFAULT NULL,
  `dniCuitCuil` varchar(20) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `localidad` varchar(100) NOT NULL,
  `provincia` varchar(50) NOT NULL,
  `usuario` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(30) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `puntos` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `uq_usuario` (`usuario`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `uq_doc` (`dniCuitCuil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher`
--

DROP TABLE IF EXISTS `voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher` (
  `idVoucher` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `idVoucherTipo` int NOT NULL,
  `estado` varchar(30) NOT NULL,
  `fechaAdquisicion` datetime DEFAULT NULL,
  `fechaUso` datetime DEFAULT NULL,
  PRIMARY KEY (`idVoucher`),
  KEY `idx_voucher_usuario` (`idUsuario`),
  KEY `idx_voucher_tipo` (`idVoucherTipo`),
  KEY `idx_voucher_estado` (`estado`),
  CONSTRAINT `fk_voucher_tipo` FOREIGN KEY (`idVoucherTipo`) REFERENCES `voucher_tipo` (`idVoucherTipo`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_voucher_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher`
--

LOCK TABLES `voucher` WRITE;
/*!40000 ALTER TABLE `voucher` DISABLE KEYS */;
/*!40000 ALTER TABLE `voucher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_tipo`
--

DROP TABLE IF EXISTS `voucher_tipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_tipo` (
  `idVoucherTipo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `descripcion` text NOT NULL,
  `puntosRequeridos` int NOT NULL,
  `montoBeneficio` int NOT NULL,
  `fechaInicioVigencia` date NOT NULL,
  `fechaFinVigencia` date NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idVoucherTipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_tipo`
--

LOCK TABLES `voucher_tipo` WRITE;
/*!40000 ALTER TABLE `voucher_tipo` DISABLE KEYS */;
/*!40000 ALTER TABLE `voucher_tipo` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-16 21:38:57
