import { IAgencyService } from '../../src/remote/agency.service.interface';

export class MockAgencyService implements IAgencyService {

    constructor(private readonly connectionData: string) {}

    public spinUpAgent(): Promise<any> {
        return Promise.resolve({
            data: {
                connectionData: this.connectionData
            }
        });
    }

    public registerMultitenantAgent(): Promise<any> {
        return Promise.resolve({
            data: {
                invitation: this.connectionData
            }
        });
    }
}
