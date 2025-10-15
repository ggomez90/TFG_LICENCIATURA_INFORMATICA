import { IsISO8601, IsOptional } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsISO8601()
  from?: string; // ISO-8601

  @IsOptional()
  @IsISO8601()
  to?: string;   // ISO-8601
}
