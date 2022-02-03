import { HttpService } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { IExternalControllerService } from '../external.controller.service.interface';
import { ExternalId } from '../../db/entity/external.id';

export class RmsExternalControllerService implements IExternalControllerService {

    private readonly http: ProtocolHttpService;

    /**
     * We pass in the parent class as context so we can access the sms module
     */
    constructor(
        httpService: HttpService,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    public async callExternalWalletCreate(externalIds: ExternalId[]): Promise<string> {
        const identityNumber: string = externalIds[0].external_id;
        // for honduras this is NumeroIdentidad
        const data = {
            citizenIdentifier: identityNumber
        };

        const url = `http://${process.env.INTEGRATION_CONTROLLER}/v2/api/onboard/createVerifyCitizen`;
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
