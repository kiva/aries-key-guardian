import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PluginTypeEnum } from '../../plugins/plugin.type.enum.js';
import { CreateFiltersDto } from './create.filters.dto.js';
import { Type } from 'class-transformer';

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
        description: 'Filters to help identify the entity later. E.g. { externalIds: { governmentId: 123 } }'
    })
    @ValidateNested() @Type(() => CreateFiltersDto) readonly filters: CreateFiltersDto;

    @ApiProperty({
        description: 'Parameters used to authenticate the entity, depending on plugin type. eg { fingerprintTemplate: xyz, position: 1 }'
    })
    @IsNotEmpty() readonly params: any;

}
