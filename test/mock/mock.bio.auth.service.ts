import { IBioAuthService } from '../../src/remote/bio.auth.service.interface';

export class MockBioAuthService implements IBioAuthService {

    constructor(private readonly status: string, private readonly agentId: string) {}

    public bulkSave(): Promise<any> {
        return Promise.resolve(undefined);
    }

    public verifyFingerprint(): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                agentId: this.agentId,
            },
        });
    }

    public verifyFingerprintTemplate(): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                agentId: this.agentId,
            },
        });
    }

    public qualityCheck(): Promise<any> {
        return Promise.resolve({
            data: [1]
        });
    }
}
