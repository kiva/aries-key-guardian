import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SmsFiltersDto } from './sms.filters.dto';
import { SmsParamsDto } from './sms.params.dto';

/**
 * TODO define subtypes
 */
export class SmsVerifyDto {

    @ApiProperty({
        description: 'JSON filters object to identify a specific entity, either national id or voter id'
    })
    @ValidateNested() @Type(() => SmsFiltersDto) readonly filters: SmsFiltersDto;

    @ApiProperty({
        description: 'JSON params object used to authenticate the identified entity, eg phone number or OTP'
    })
    @ValidateNested() @Type(() => SmsParamsDto) readonly params: SmsParamsDto;

}
