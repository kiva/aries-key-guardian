import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for SMS Filters
 * Note we use govId1 and govId2 to be generic to country implementation, eg in SL 1 is national id and 2 is voter id
 */
export class SmsFiltersDto {

    @ApiPropertyOptional({
        description: 'Government ID 1, eg National ID'
    })
    @IsOptional() readonly govId1: any;

    @ApiPropertyOptional({
        description: 'Government ID 2, eg Voter ID'
    })
    @IsOptional() readonly govId2: any;

}
