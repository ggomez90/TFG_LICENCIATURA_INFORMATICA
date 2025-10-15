import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class IdParamDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id!: number;
}
