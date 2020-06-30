import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for a fingerprint authentication request
 */
export class FingerprintAuthDto {

    @ApiProperty()
    @IsNumber() readonly position: number;

    /* Exact validation of the filters should be done by the identity service */
    @ApiProperty()
    @IsNotEmpty() readonly filters: any;

    @ApiProperty()
    @IsString() readonly image: string;

    @ApiProperty()
    @IsNotEmpty() readonly device: any;

}