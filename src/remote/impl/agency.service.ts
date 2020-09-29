import { HttpService, Injectable } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { IAgencyService } from '../agency.service.interface';
import { Logger } from 'protocol-common/logger';

@Injectable()
export class AgencyService implements IAgencyService {

    private readonly http: ProtocolHttpService;
    private readonly baseUrl: string;

    constructor(private readonly httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
        this.baseUrl = process.env.AGENCY_URL;
    }

    /**
     * This combines a call to spin up the agent and get it's connection data
     * Note there's an issue with the autoConnect which is why this is broken into 2 calls
     */
    public async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, seed: string, agentId: string): Promise<any> {
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: this.baseUrl + '/v1/manager',
            data: {
                walletId,
                walletKey,
                adminApiKey,
                seed,
                agentId,
                autoConnect: false,
            }
        };
        const response = await this.http.requestWithRetry(request);
        Logger.log(`Spun up agent ${agentId}`);
        const requestConnect: AxiosRequestConfig = {
            method: 'POST',
            url: this.baseUrl + '/v1/manager/connect',
            data: {
                agentId,
                adminApiKey,
            }
        };
        Logger.log(`Connecting to agent ${agentId}`);
        return await this.http.requestWithRetry(requestConnect);
    }
}
