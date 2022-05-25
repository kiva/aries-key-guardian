import { BioAuthSaveParamsDto } from './bio.auth.save.params.dto.js';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for the body of the request sent to Bio Auth Service's /save endpoint
 */
export class BioAuthSaveDto {
    @IsString() readonly agentId: string;
    @ValidateNested() @Type(() => BioAuthSaveParamsDto) readonly params: BioAuthSaveParamsDto;
}
