import { IIdentityService } from '../../src/remote/identity.service.interface';

export class MockIdentityService implements IIdentityService {

    constructor(private readonly status: string, private readonly did: string) {}

    async templatize(data: any): Promise<any> {
        return Promise.resolve(undefined);
    }

    async verifyFingerprint(position: number, image: string, filters: any): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                did: this.did,
            },
        });
    }

    async verifyFingerprintTemplate(position: number, template: string, filters: any): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                did: this.did,
            },
        });
    }

    async qualityCheck(filters: any): Promise<any> {
        return Promise.resolve({
            data: [1]
        });
    }
}
