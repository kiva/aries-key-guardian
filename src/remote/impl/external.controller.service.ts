import { HttpService, Injectable } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { IExternalControllerService } from '../external.controller.service.interface';
import { OnboardResponseDto } from '../dto/onboard.response.dto';
import { isValidInstanceOrFail } from 'protocol-common/validation/validations/is.valid.instance';

/*
 * Controller Service for an external source using restful API
 */
@Injectable()
export class ExternalControllerService implements IExternalControllerService {

    private readonly http: ProtocolHttpService;

    constructor(httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
    }

    public async callExternalWalletCreate(id: string): Promise<OnboardResponseDto> {
        const data = {
            citizenIdentifier: id
        };

        const url = `${process.env.INTEGRATION_CONTROLLER}/v2/api/onboard`;
        const req: any = {
            method: 'POST',
            url,
            data
        };
        const res = await this.http.requestWithRetry(req);
        isValidInstanceOrFail(res.data, OnboardResponseDto);
        return res.data;
    }
}
