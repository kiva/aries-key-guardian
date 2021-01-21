import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject, IsOptional } from 'class-validator';

export abstract class CreateFiltersDto {

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_national_id".'
    })
    @IsOptional() @IsNotEmpty() readonly govId1: string | undefined;

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_voter_id".'
    })
    @IsOptional() @IsNotEmpty() readonly govId2: string | undefined;

    @ApiProperty({
        description: 'A list of any number of IDs related to a particular DID.'
    })
    @IsOptional() @IsNotEmptyObject() readonly externalIds: Map<string, string>;
}
