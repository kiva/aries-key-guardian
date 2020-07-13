import { IsNotEmptyObject, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PluginTypeEnum } from '../plugins/plugin.type.enum'

/**
 * DTO for the create endpoint
 */
export class CreateDto {

    @ApiProperty({
        description: 'Authentication plugin type to use, eg FINGERPRINT',
        enum: PluginTypeEnum,
    })
    @IsEnum(PluginTypeEnum) readonly pluginType: string;

    @ApiProperty({
        description: 'JSON filters object to save so we can identify the entity later, dependant on plugin type, eg { governmentId: 123 }'
    })
    @IsNotEmptyObject() readonly filters: any;

    @ApiProperty({
        description: 'JSON params object or array to save so we can authenticate the entity, dependant on plugin type, eg { fingerprintTemplate: xyz, position: 1 }'
    })
    @IsNotEmpty() readonly params: any;

}
