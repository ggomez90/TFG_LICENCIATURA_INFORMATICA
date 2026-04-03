/*
  Warnings:

  - A unique constraint covering the columns `[idEncuesta,idUsuario]` on the table `RespuestaEncuesta` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idEncuesta,dniCuilCuitInvitado]` on the table `RespuestaEncuesta` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `RespuestaEncuesta_idEncuesta_idUsuario_key` ON `RespuestaEncuesta`(`idEncuesta`, `idUsuario`);

-- CreateIndex
CREATE UNIQUE INDEX `RespuestaEncuesta_idEncuesta_dniCuilCuitInvitado_key` ON `RespuestaEncuesta`(`idEncuesta`, `dniCuilCuitInvitado`);
