import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyFiltersDto {

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_national_id".'
    })
    @IsOptional() @IsNotEmpty() readonly govId1: string | undefined;

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_voter_id".'
    })
    @IsOptional() @IsNotEmpty() readonly govId2: string | undefined;

    @ApiProperty({
        description: 'Type of external ID to filter on. E.g. "sl_national_id"'
    })
    @IsOptional() @IsNotEmpty() readonly externalIdType: string | undefined;

    @ApiProperty({
        description: 'Value of external ID to filter on. E.g. "NIN11111"'
    })
    @IsOptional() @IsNotEmpty() readonly externalId: string | undefined;
}
