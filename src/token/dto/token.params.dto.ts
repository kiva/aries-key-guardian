import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Token Params
 */
export class TokenParamsDto {

    @ApiProperty({
        description: 'Auth0 token containing an agentId for an agent'
    })
    @IsOptional() @IsString() readonly token: string;

}
