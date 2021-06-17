import { BioAuthSaveParamsDto } from './bio.auth.save.params.dto';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for the body of the request sent to Bio Auth Service's /save endpoint
 */
export class BioAuthSaveDto {
    @IsString() readonly id: string;
    @ValidateNested() @Type(() => BioAuthSaveParamsDto) readonly params: BioAuthSaveParamsDto;
}
