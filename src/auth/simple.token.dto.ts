import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for simple tokens based on wallet id & key
 */
export class SimpleTokenDto {

    /** The id of the wallet */
    @ApiProperty()
    @IsString() readonly id: string;

    /** The key of the wallet */
    @ApiProperty()
    @IsString() readonly key: string;

    /** The did of the wallet */
    @ApiProperty({ required: false })
    @IsOptional() @IsString() readonly did: string;
}