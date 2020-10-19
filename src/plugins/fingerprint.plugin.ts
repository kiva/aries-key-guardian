import { IPlugin } from './plugin.interface';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { IIdentityService } from '../remote/identity.service.interface';
import { Logger } from 'protocol-common/logger';

export class FingerprintPlugin implements IPlugin {

    /**
     * We pass in the parent class as context so we can access the sms module
     */
    constructor(private readonly identityService: IIdentityService) { }

    public async verify(filters: any, params: any) {
        let response;
        try {
            response = await this.identityService.verify(params.position, params.image, filters);
        } catch(e) {
            // Handle specific error codes
            switch (e.code) {
                case 'FINGERPRINT_NO_MATCH':
                case 'FINGERPRINT_MISSING_NOT_CAPTURED':
                case 'FINGERPRINT_MISSING_AMPUTATION':
                case 'FINGERPRINT_MISSING_UNABLE_TO_PRINT':
                    if (process.env.QUALITY_CHECK_ENABLED === 'true') {
                        e = await this.fingerprintQualityCheck(e, filters);
                    }
                    // no break, fall through
                default:
                    throw e;
            }
        }

        //  The identity service should throw this error on no match, but just to be safe double check it and throw here
        if (response.data.status !== 'matched') {
            throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NOMATCH, 'Fingerprint did not match stored records for citizen supplied through filters');
        }

        // TODO right now the data we get from identity service uses did we should change it to agent id and then we don't need this conversion
        return {
            status: response.data.status,
            id: response.data.did
        };
    }

    private async fingerprintQualityCheck(e: any, filters: any): Promise<any> {
        try {
            const response = await this.identityService.qualityCheck(filters);
            e.details = e.details || {};
            e.details.bestPositions = response.data;
        } catch (ex) {
            Logger.error('Error calling identity service position quality check', ex);
        }
        return e;
    }

    public async save(id: string, filters: any, params: any) {
        // TEMP until the identity service is updated
        const data = Array.isArray(params) ? params : [params];
        for (const datum of data) {
            datum.did = id;
        }
        await this.identityService.templatize(data);
    }
}
