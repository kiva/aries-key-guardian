import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyObject } from 'class-validator';

export class VerifyFiltersDto {

    @ApiProperty({
        description: 'An object containing any number of IDs related to a particular Agent ID, as long as they all refer to the same Agent ID.'
    })
    @IsNotEmptyObject() readonly externalIds: object;

    public static getIds(filters: VerifyFiltersDto): Map<string, string> {
        return new Map<string, string>(Object.entries(filters.externalIds));
    }
}
