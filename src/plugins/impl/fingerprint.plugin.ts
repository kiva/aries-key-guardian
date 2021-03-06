import { IPlugin } from '../plugin.interface';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { IIdentityService } from '../../remote/identity.service.interface';
import { Logger } from 'protocol-common/logger';
import { VerifyFingerprintTemplateDto } from '../dto/verify.fingerprint.template.dto';
import { VerifyFingerprintImageDto } from '../dto/verify.fingerprint.image.dto';
import { ExternalId } from '../../db/entity/external.id';
import { VerifyFiltersDto } from '../dto/verify.filters.dto';
import { ExternalIdRepository } from '../../db/external.id.repository';

export class FingerprintPlugin implements IPlugin {

    /**
     * We pass in the parent class as context so we can access the sms module
     */
    constructor(
        private readonly identityService: IIdentityService,
        private readonly externalIdRepository: ExternalIdRepository
    ) { }

    /**
     * The verify logic involves calling verify against the identity service, and then handling certain error codes
     * by asking the identity service for the positions with the highest image quality
     * TODO identity service could just handle both these tasks in one call.
     */
    public async verify(filters: VerifyFiltersDto, params: VerifyFingerprintImageDto | VerifyFingerprintTemplateDto) {

        const externalIds: ExternalId[] = await this.externalIdRepository.fetchExternalIds(VerifyFiltersDto.getIds(filters));
        const dids: string = externalIds.map((externalId: ExternalId) => externalId.did).join(',');

        let response;
        try {
            if (VerifyFingerprintImageDto.isInstance(params)) {
                response = await this.identityService.verifyFingerprint(params.position, params.image, dids);
            } else {
                response = await this.identityService.verifyFingerprintTemplate(params.position, params.template, dids);
            }
        } catch(e) {
            // Handle specific error codes
            switch (e.code) {
                case ProtocolErrorCode.FINGERPRINT_NO_MATCH:
                case ProtocolErrorCode.FINGERPRINT_MISSING_NOT_CAPTURED:
                case ProtocolErrorCode.FINGERPRINT_MISSING_AMPUTATION:
                case ProtocolErrorCode.FINGERPRINT_MISSING_UNABLE_TO_PRINT:
                    if (process.env.QUALITY_CHECK_ENABLED === 'true') {
                        e = await this.fingerprintQualityCheck(e, dids);
                    }
                // no break, fall through
                default:
                    throw e;
            }
        }

        //  The identity service should throw this error on no match, but just to be safe double check it and throw here
        if (response.data.status !== 'matched') {
            throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NO_MATCH, 'Fingerprint did not match stored records for citizen supplied through filters');
        }

        // TODO right now the data we get from identity service uses did we should change it to agent id and then we don't need this conversion
        return {
            status: response.data.status,
            id: response.data.did
        };
    }

    private async fingerprintQualityCheck(e: any, dids: string): Promise<any> {
        try {
            const response = await this.identityService.qualityCheck(dids);
            e.details = e.details || {};
            e.details.bestPositions = response.data;
        } catch (ex) {
            Logger.error('Error calling identity service position quality check', ex);
        }
        return e;
    }

    public async save(id: string, params: any) {
        // TEMP until the identity service is updated
        const data = Array.isArray(params) ? params : [params];
        for (const datum of data) {
            datum.did = id;
        }
        await this.identityService.templatize(data);
    }
}
