import { BioAuthSaveDto } from './bio.auth.save.dto';
import { ValidateNested } from 'class-validator';

/**
 * DTO for each fingerprint in the body of the request sent to Bio Auth Service's /save endpoint
 */
export class BioAuthBulkSaveDto {
    @ValidateNested() readonly fingerprints: Array<BioAuthSaveDto>;
}
