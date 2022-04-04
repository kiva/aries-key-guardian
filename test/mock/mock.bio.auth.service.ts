/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Disabled @typescript-eslint/no-unused-vars because MockBioAuthService methods
 * are required to fulfill interface requirements of IBioAuthService, but we aren't
 * using the parameters for our tests
 */
import { IBioAuthService } from '../../src/remote/bio.auth.service.interface';
import { BioAuthBulkSaveDto } from '../../src/remote/dto/bio.auth.bulk.save.dto';

export class MockBioAuthService implements IBioAuthService {

    constructor(private readonly status: string, private readonly agentId: string) {}

    async bulkSave(dto: BioAuthBulkSaveDto): Promise<any> {
        return Promise.resolve(undefined);
    }

    async verifyFingerprint(position: number, image: string, agentIds: string[], externalIds: object): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                agentId: this.agentId,
            },
        });
    }

    async verifyFingerprintTemplate(position: number, template: string, agentIds: string[]): Promise<any> {
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
