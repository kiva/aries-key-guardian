import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SmsFiltersDto } from './sms.filters.dto';
import { SmsParamsDto } from './sms.params.dto';

/**
 * TODO define subtypes
 */
export class SmsSaveDto {

    @ApiProperty({
        description: 'ID used to save a record for this entity, eg agent id'
    })
    @IsString() readonly id: string;

    @ApiProperty({
        description: 'JSON filters object to save so we can identify the entity later eg { nationialId: 123 }'
    })
    @ValidateNested() @Type(() => SmsFiltersDto) readonly filters: SmsFiltersDto;

    @ApiProperty({
        description: 'JSON params object to save so we can authenticate the entity eg { phoneNumber: +23276543210 }'
    })
    @ValidateNested() @Type(() => SmsParamsDto) readonly params: SmsParamsDto;

}
