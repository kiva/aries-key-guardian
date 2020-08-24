import { IsOptional, IsNumber, IsPhoneNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for SMS Params
 */
export class SmsParamsDto {

    @ApiPropertyOptional({
        description: 'Phone number including country code, eg +14151234567'
    })
    @IsOptional() @IsPhoneNumber('ZZ') readonly phoneNumber: any;

    @ApiPropertyOptional({
        description: '6-digit One Time Password, eg 123456'
    })
    @IsOptional() @IsNumber() readonly otp: number;

    @ApiPropertyOptional({
        description: 'Value of the Authorization header, if present'
    })
    @IsOptional() readonly authorization: string;

}
