import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Auth0 Token Params
 */
export class TokenParamsDto {

    @ApiProperty({
        description: 'Auth0 token containing a did for an agent'
    })
    @IsOptional() @IsString() readonly token: string;

}
