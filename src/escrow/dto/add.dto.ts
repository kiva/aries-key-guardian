import { IsString, IsNotEmptyObject, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PluginTypeEnum } from '../../plugins/plugin.type.enum';
import { CreateFiltersDto } from './create.filters.dto';
import { Type } from 'class-transformer';

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
        description: 'JSON filters object to save so we can identify the entity later, depending on plugin type. eg { governmentId: 123 }'
    })
    @ValidateNested() @Type(() => CreateFiltersDto) readonly filters: CreateFiltersDto;

    @ApiProperty({
        description:
            'JSON params object to save so we can authenticate the entity, depending on plugin type. eg { fingerprintTemplate: xyz, position: 1 }'
    })
    @IsNotEmptyObject() readonly params: any;

}
