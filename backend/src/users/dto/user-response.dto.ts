import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() phone?: string;
  @ApiProperty() email?: string;
  @ApiProperty() first_name!: string;
  @ApiProperty() last_name!: string;
  @ApiProperty() is_active!: boolean;
  @ApiProperty() phone_verified!: boolean;
}
