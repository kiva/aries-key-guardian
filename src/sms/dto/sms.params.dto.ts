import { IsOptional, IsPhoneNumber, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for SMS Params
 */
export class SmsParamsDto {

    @ApiPropertyOptional({
        description: 'Phone number including country code, eg +14151234567'
    })
    @IsOptional() @IsPhoneNumber() readonly phoneNumber: string;

    @ApiPropertyOptional({
        description: '6-digit One Time Password, eg 123456'
    })
    @IsOptional() @IsInt() @Min(111111) @Max(999999) readonly otp: number;

    @IsOptional() @IsString() readonly authorization: string;

}
