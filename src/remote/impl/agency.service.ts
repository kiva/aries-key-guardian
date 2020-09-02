import { HttpService, Injectable } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { IAgencyService } from '../agency.service.interface';

@Injectable()
export class AgencyService implements IAgencyService {

    private readonly http: ProtocolHttpService;
    private readonly baseUrl: string;

    constructor(private readonly httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
        this.baseUrl = process.env.AGENCY_URL;
    }

    public async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, seed: string, alias: string): Promise<any> {
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: this.baseUrl + '/v1/manager',
            data: {
                walletId,
                walletKey,
                adminApiKey,
                seed,
                alias
            }
        };
        return this.http.requestWithRetry(request);
    }
}