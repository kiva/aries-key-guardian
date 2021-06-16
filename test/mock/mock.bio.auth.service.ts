import { IBioAuthService } from '../../src/remote/bio.auth.service.interface';
import { BioAuthBulkSaveDto } from '../../src/remote/dto/bio.auth.bulk.save.dto';

export class MockBioAuthService implements IBioAuthService {

    constructor(private readonly status: string, private readonly did: string) {}

    async bulkSave(dto: BioAuthBulkSaveDto): Promise<any> {
        return Promise.resolve(undefined);
    }

    async verifyFingerprint(position: number, image: string, dids: string): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                did: this.did,
            },
        });
    }

    async verifyFingerprintTemplate(position: number, template: string, dids: string): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                did: this.did,
            },
        });
    }

    async qualityCheck(dids: string): Promise<any> {
        return Promise.resolve({
            data: [1]
        });
    }
}
