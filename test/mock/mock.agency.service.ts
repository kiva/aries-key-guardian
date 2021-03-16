import { IAgencyService } from '../../src/remote/agency.service.interface';

export class MockAgencyService implements IAgencyService {

    constructor(private readonly connectionData: string) {}

    async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, seed: string, agentId: string): Promise<any> {
        return Promise.resolve({
            data: {
                connectionData: this.connectionData
            }
        });
    }

    async registerMultitenantAgent(walletName: string, walletKey: string, label: string): Promise<any> {
        return Promise.resolve({
            data: {
                connectionData: this.connectionData
            }
        });
    }
}
