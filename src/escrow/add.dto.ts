import { IsString, IsNotEmptyObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PluginTypeEnum } from '../plugins/plugin.type.enum';

/**
 * DTO for the add endpoint
 */
export class AddDto {

    @ApiProperty({
        description: 'Authentication plugin type to use, eg FINGERPRINT',
        enum: PluginTypeEnum,
    })
    @IsEnum(PluginTypeEnum) readonly pluginType: string;

    @ApiProperty({
        description: 'ID used to save a record for this entity, eg agent id'
    })
    @IsString() readonly id: string;

    @ApiProperty({
        description: 'JSON filters object to save so we can identify the entity later, dependant on plugin type, eg { governmentId: 123 }'
    })
    @IsNotEmptyObject() readonly filters: any;

    @ApiProperty({
        description: 'JSON params object to save so we can authenticate the entity, dependant on plugin type, eg { fingerprintTemplate: xyz, position: 1 }'
    })
    @IsNotEmptyObject() readonly params: any;

}
