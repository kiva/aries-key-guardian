import { Injectable } from '@nestjs/common';
import { IExternalControllerService } from '../external.controller.service.interface.js';
import { OnboardResponseDto } from '../dto/onboard.response.dto.js';
import { ProtocolHttpService } from 'protocol-common';
import { isValidInstanceOrFail } from 'protocol-common/validation';

/*
 * Controller Service for an external source using restful API
 */
@Injectable()
export class ExternalControllerService implements IExternalControllerService {

    constructor(private readonly http: ProtocolHttpService) {}

    public async callExternalWalletCreate(id: string): Promise<OnboardResponseDto> {
        const url = `${process.env.INTEGRATION_CONTROLLER}/v2/api/onboard`;
        const req: any = {
            method: 'POST',
            url,
            data: {
                citizenIdentifier: id
            }
        };
        const res = await this.http.requestWithRetry(req);
        isValidInstanceOrFail(res.data, OnboardResponseDto);
        return res.data;
    }
}
