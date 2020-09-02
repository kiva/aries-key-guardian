import { IIdentityService } from '../../src/remote/identity.service.interface';

export class MockIdentityService implements IIdentityService {

    constructor(private readonly status: string, private readonly did: string) {}

    async templatize(data: any): Promise<any> {
        return Promise.resolve(undefined);
    }

    async verify(position: number, image: string, filters: any): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                did: this.did,
            },
        });
    }
}