import { IsNotEmptyObject, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PluginTypeEnum } from '../../plugins/plugin.type.enum';

/**
 * DTO for the verify endpoint
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
    @IsObject() readonly filters: any;

    @ApiProperty({
        description: 'JSON params object used to authenticate the identified entity, eg fingerprint template and finger position'
    })
    @IsNotEmptyObject() readonly params: any;

}