import { IPlugin } from '../plugin.interface';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { IBioAuthService } from '../../remote/bio.auth.service.interface';
import { Logger } from 'protocol-common/logger';
import { VerifyFingerprintTemplateDto } from '../dto/verify.fingerprint.template.dto';
import { VerifyFingerprintImageDto } from '../dto/verify.fingerprint.image.dto';
import { ExternalId } from '../../db/entity/external.id';
import { VerifyFiltersDto } from '../dto/verify.filters.dto';
import { ExternalIdDbGateway } from '../../db/external.id.db.gateway';
import { IsValidInstance } from 'protocol-common/validation/decorators/parameter/is.valid.instance.decorator';
import { ValidateParams } from 'protocol-common/validation/decorators/function/validate.params.decorator';
import { IsValidInstanceOf } from 'protocol-common/validation/decorators/parameter/is.valid.instance.of.decorator';
import { BioAuthSaveParamsDto } from '../../remote/dto/bio.auth.save.params.dto';
import { BioAuthSaveDto } from '../../remote/dto/bio.auth.save.dto';

export class FingerprintPlugin implements IPlugin {
    private readonly isExternal: boolean;

    /**
     * We pass in the parent class as context so we can access the sms module
     */
    constructor(
        private readonly bioAuthService: IBioAuthService,
        private readonly externalIdDbGateway: ExternalIdDbGateway
    ) {
        this.isExternal = process.env.EXTERNAL_BIO_AUTH === 'true';
    }

    private restrictToInternal(operation: string) {
        if (this.isExternal) {
            throw new ProtocolException(ProtocolErrorCode.NOT_IMPLEMENTED, `External Bio Auth implementations do not support ${operation}`);
        }
    }

    private async fingerprintQualityCheck(e: any, agentIds: string): Promise<any> {
        this.restrictToInternal('fingerprint quality check');
        try {
            const response = await this.bioAuthService.qualityCheck(agentIds);
            e.details = e.details || {};
            e.details.bestPositions = response.data;
        } catch (ex) {
            Logger.error('Error calling Bio Auth Service fingerprint quality check', ex);
        }
        return e;
    }

    /**
     * The verify logic involves calling verify against the Bio Auth Service, and then handling certain error codes by asking the Bio Auth Service for
     * the positions with the highest image quality
     * TODO - PRO-3134: Update this after Bio Auth Service handles both these tasks in one call.
     */
    @ValidateParams
    public async verify(
        @IsValidInstanceOf(VerifyFingerprintImageDto, VerifyFingerprintTemplateDto) params: VerifyFingerprintImageDto | VerifyFingerprintTemplateDto,
        @IsValidInstance filters: VerifyFiltersDto
    ) {

        const externalIds: ExternalId[] = await this.externalIdDbGateway.fetchExternalIds(VerifyFiltersDto.getIds(filters));
        const agentIds: string = externalIds.map((externalId: ExternalId) => externalId.agent_id).join(',');

        let response;
        try {
            if (VerifyFingerprintImageDto.isInstance(params)) {
                response = await this.bioAuthService.verifyFingerprint(params.position, params.image, externalIds);
            } else {
                this.restrictToInternal('template-based fingerprint verification');
                response = await this.bioAuthService.verifyFingerprintTemplate(params.position, params.template, externalIds);
            }
        } catch(e) {
            // Handle specific error codes
            switch (e.code) {
                case ProtocolErrorCode.FINGERPRINT_NO_MATCH:
                case ProtocolErrorCode.FINGERPRINT_MISSING_NOT_CAPTURED:
                case ProtocolErrorCode.FINGERPRINT_MISSING_AMPUTATION:
                case ProtocolErrorCode.FINGERPRINT_MISSING_UNABLE_TO_PRINT:
                    if (process.env.QUALITY_CHECK_ENABLED === 'true' && !this.isExternal) {
                        e = await this.fingerprintQualityCheck(e, agentIds);
                    }
                // no break, fall through
                default:
                    throw e;
            }
        }

        //  Bio Auth Service should throw this error on no match, but just to be safe double check it and throw here
        if (response.data.status !== 'matched') {
            throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NO_MATCH, 'Fingerprint did not match stored records for citizen supplied through filters');
        }

        // If we're dealing with an external verifier, they won't be able to return an agentId. It will be able to return the externalId that matched,
        // so use that to find the appropriate agentId.
        let id = response.data.agentId;
        if (response.data.externalId) {
            id = externalIds.find((externalId: ExternalId) => externalId.external_id === response.data.externalId);
        }

        return {
            status: response.data.status,
            id
        };
    }

    public async save(agentId: string, params: BioAuthSaveParamsDto | BioAuthSaveParamsDto[]) {
        this.restrictToInternal('saving new fingerprint(s)');
        const data = Array.isArray(params) ? params : [params];
        const fingerprints: BioAuthSaveDto[] = data.map((param: BioAuthSaveParamsDto) => {
            return {agentId, params: param};
        });
        await this.bioAuthService.bulkSave({fingerprints});
    }
}
