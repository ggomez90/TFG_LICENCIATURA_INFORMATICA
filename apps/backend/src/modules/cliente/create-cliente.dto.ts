import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateClienteDto {
  // PK = idUsuario (uno a uno con Usuario cuyo rol=CLIENTE). Se recibe explícito o se infiere del token.
  @IsInt()
  @Min(1)
  idCliente!: number;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  razonSocial?: string;

  @IsString()
  @Length(1, 100)
  direccion!: string;

  @IsInt()
  @Min(1)
  idProvincia!: number;

  @IsInt()
  @Min(1)
  idLocalidad!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idTipoCliente?: number; // nullable

  @IsInt()
  @Min(0)
  puntos!: number; // default 0 (también podés setearlo en servicio)
}
