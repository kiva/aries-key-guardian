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

    /**
     * We pass in the parent class as context so we can access the sms module
     */
    constructor(
        private readonly bioAuthService: IBioAuthService,
        private readonly externalIdDbGateway: ExternalIdDbGateway
    ) { }

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
                response = await this.bioAuthService.verifyFingerprint(params.position, params.image, agentIds);
            } else {
                response = await this.bioAuthService.verifyFingerprintTemplate(params.position, params.template, agentIds);
            }
        } catch(e) {
            // Handle specific error codes
            switch (e.code) {
                case ProtocolErrorCode.FINGERPRINT_NO_MATCH:
                case ProtocolErrorCode.FINGERPRINT_MISSING_NOT_CAPTURED:
                case ProtocolErrorCode.FINGERPRINT_MISSING_AMPUTATION:
                case ProtocolErrorCode.FINGERPRINT_MISSING_UNABLE_TO_PRINT:
                    if (process.env.QUALITY_CHECK_ENABLED === 'true') {
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

        return {
            status: response.data.status,
            id: response.data.agentId
        };
    }

    private async fingerprintQualityCheck(e: any, agentIds: string): Promise<any> {
        try {
            const response = await this.bioAuthService.qualityCheck(agentIds);
            e.details = e.details || {};
            e.details.bestPositions = response.data;
        } catch (ex) {
            Logger.error('Error calling Bio Auth Service position quality check', ex);
        }
        return e;
    }

    public async save(agentId: string, params: BioAuthSaveParamsDto | BioAuthSaveParamsDto[]) {
        const data = Array.isArray(params) ? params : [params];
        const fingerprints: BioAuthSaveDto[] = data.map((param: BioAuthSaveParamsDto) => {
            return {agentId, params: param};
        });
        await this.bioAuthService.bulkSave({fingerprints});
    }
}
