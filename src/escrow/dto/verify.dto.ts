import { IsNotEmptyObject, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PluginTypeEnum } from '../../plugins/plugin.type.enum';
import { VerifyFiltersDto } from '../../plugins/dto/verify.filters.dto';
import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';

/**
 * DTO for the verify endpoint
 *
 * @tothink I'm not sure if we should have open endpoints where you can pass in the plugin type, or a bunch of specific endpoints
 * where the plugin type is hard coded in each
 */
export class VerifyDto {

    @ApiProperty({
        description: 'Authentication plugin type to use, eg FINGERPRINT',
        enum: PluginTypeEnum,
    })
    @IsEnum(PluginTypeEnum) readonly pluginType: string;

    @ApiProperty({
        description: 'JSON filters object to identify a specific entity, eg government id'
    })
    @Optional() @ValidateNested() @Type(() => VerifyFiltersDto) readonly filters: VerifyFiltersDto;

    @ApiProperty({
        description: 'JSON params object used to authenticate the identified entity, eg fingerprint template and finger position'
    })
    @IsNotEmptyObject() readonly params: any;

}
