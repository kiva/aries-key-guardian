import { HttpService, Injectable } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { IAgencyService } from '../agency.service.interface';
import { Logger } from 'protocol-common/logger';

@Injectable()
export class AgencyService implements IAgencyService {

    private readonly http: ProtocolHttpService;
    private readonly baseUrl: string;

    constructor(httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
        this.baseUrl = process.env.AGENCY_URL;
    }

    /**
     * Note that we are using multitenant agents as the default now, but leaving around the single agent spin up to provide the option
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
        await this.http.requestWithRetry(request);
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

    /**
     * Makes a call to register an agent/wallet with the multitenant aca-py instance
     * Note that this introduces some new terminology closer to what aca-py uses:
     *   walletName instead of walletId
     *   label instead of agentId
     * The return object includes a connectionData arg
     */
    public async registerMultitenantAgent(walletName: string, walletKey: string, label: string): Promise<any> {
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: this.baseUrl + '/v2/multitenant',
            data: {
                walletName,
                walletKey,
                label
            }
        };
        const res = await this.http.requestWithRetry(request);
        Logger.log(`Registered multitenant agent ${label}`);
        return res;
    }
}
