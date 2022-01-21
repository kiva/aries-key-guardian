import { BioAuthBulkSaveDto } from './dto/bio.auth.bulk.save.dto';
import { ExternalId } from '../db/entity/external.id';

export abstract class IBioAuthService {
    abstract verifyFingerprint(position: number, image: string, ids: ExternalId[]): Promise<any>;
    abstract verifyFingerprintTemplate(position: number, template: string, ids: ExternalId[]): Promise<any>;
    abstract bulkSave(dto: BioAuthBulkSaveDto): Promise<any>;
    abstract qualityCheck(agentIds: string): Promise<any>;
}
