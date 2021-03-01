import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNotEmptyObject, IsOptional } from 'class-validator';

export class VerifyFiltersDto {

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_national_id".'
    })
    @IsOptional() @IsNotEmpty() readonly nationalId: string | undefined;

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_voter_id".'
    })
    @IsOptional() @IsNotEmpty() readonly voterId: string | undefined;

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_national_id".'
    })
    @IsOptional() @IsNotEmpty() readonly govId1: string | undefined;

    @ApiProperty({
        description: 'DEPRECATED. A hardcoded id that could be provided. Maps to type "sl_voter_id".'
    })
    @IsOptional() @IsNotEmpty() readonly govId2: string | undefined;

    @ApiProperty({
        description: 'An object containing any number of IDs related to a particular DID, as long as they all refer to the same DID.'
    })
    @IsOptional() @IsNotEmptyObject() readonly externalIds: object;

    // TODO: Remove this in favor of just using externalIds once we've removed the deprecated code (PRO-2676)
    static getIds(filters: VerifyFiltersDto): Map<string, string> {
        const ids: Map<string, string> = new Map<string, string>(Object.entries(filters.externalIds ?? {}));
        if (filters.govId1 || filters.nationalId) {
            ids.set('sl_national_id', filters.govId1 ?? filters.nationalId);
        }
        if (filters.govId2 || filters.voterId) {
            ids.set('sl_voter_id', filters.govId2 ?? filters.voterId);
        }
        return ids;
    }
}
