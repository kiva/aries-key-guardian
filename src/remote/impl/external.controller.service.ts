import { HttpService, Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { IExternalControllerService } from '../external.controller.service.interface';

/*
 * Controller Service for an external source using restful API
 */
@Injectable()
export class ExternalControllerService implements IExternalControllerService {

    private readonly http: ProtocolHttpService;

    constructor(httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
    }

    public async callExternalWalletCreate(id: string): Promise<string> {
        const data = {
            citizenIdentifier: id
        };

        const url = `${process.env.INTEGRATION_CONTROLLER}/v2/api/onboard`;
        const req: any = {
            method: 'POST',
            url,
            data
        };
        Logger.debug(`onboard/createVerifyCitizen ${url}`);
        const res = await this.http.requestWithRetry(req);
        Logger.debug(`onboard/createVerifyCitizen results`, res.data);
        return res.data.result;
    }
}
