import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  stadium_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  file_url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean = false;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sort_order?: number = 0;
}
