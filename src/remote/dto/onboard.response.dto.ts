import { IsBoolean, IsDefined, IsOptional, IsString } from 'class-validator';

/**
 * DTO for the response from a call to /onboard
 */
export class OnboardResponseDto {
    @IsDefined() @IsBoolean() readonly success: boolean;
    @IsOptional() @IsString() readonly agentId?: string;
}
