import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO to contains a single did
 */
export class DidDto {

    @ApiProperty()
    @IsString() readonly did: string;

}
