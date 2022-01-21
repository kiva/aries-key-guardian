import { IBioAuthService } from '../../src/remote/bio.auth.service.interface';
import { BioAuthBulkSaveDto } from '../../src/remote/dto/bio.auth.bulk.save.dto';
import { ExternalId } from '../../dist/db/entity/external.id';

export class MockBioAuthService implements IBioAuthService {

    constructor(private readonly status: string, private readonly agentId: string) {}

    async bulkSave(dto: BioAuthBulkSaveDto): Promise<any> {
        return Promise.resolve(undefined);
    }

    async verifyFingerprint(position: number, image: string, externalIds: ExternalId[]): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                agentId: this.agentId,
            },
        });
    }

    async verifyFingerprintTemplate(position: number, template: string, externalIds: ExternalId[]): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                agentId: this.agentId,
            },
        });
    }

    async qualityCheck(agentIds: string): Promise<any> {
        return Promise.resolve({
            data: [1]
        });
    }
}
