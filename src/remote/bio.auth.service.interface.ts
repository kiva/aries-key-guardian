import { BioAuthBulkSaveDto } from './dto/bio.auth.bulk.save.dto.js';

export abstract class IBioAuthService {
    abstract verifyFingerprint(position: number, image: string, agentIds: string[], externalIds: object): Promise<any>;
    abstract verifyFingerprintTemplate(position: number, template: string, agentIds: string[]): Promise<any>;
    abstract bulkSave(dto: BioAuthBulkSaveDto): Promise<any>;
    abstract qualityCheck(agentIds: string): Promise<any>;
}
