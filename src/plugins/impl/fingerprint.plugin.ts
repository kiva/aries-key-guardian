import { IBioAuthService } from '../../remote/bio.auth.service.interface.js';
import { IPlugin } from '../plugin.interface.js';
import { VerifyFingerprintTemplateDto } from '../dto/verify.fingerprint.template.dto.js';
import { VerifyFingerprintImageDto } from '../dto/verify.fingerprint.image.dto.js';
import { VerifyFiltersDto } from '../dto/verify.filters.dto.js';
import { BioAuthSaveParamsDto } from '../../remote/dto/bio.auth.save.params.dto.js';
import { BioAuthSaveDto } from '../../remote/dto/bio.auth.save.dto.js';
import { VerifyResultDto } from '../dto/verify.result.dto.js';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';
import { Logger } from '@nestjs/common';
import { IsValidInstance, IsValidInstanceOf, ValidateParams } from 'protocol-common/validation';

export class FingerprintPlugin implements IPlugin {

    private readonly usingExternalBioAuth: boolean;

    /**
     * We pass in the parent class as context so we can access the sms module
     */
    constructor(
        private readonly bioAuthService: IBioAuthService
    ) {
        this.usingExternalBioAuth = process.env.EXTERNAL_BIO_AUTH === 'true';
    }

    private async fingerprintQualityCheck(protocolException: ProtocolException, agentIds: string): Promise<ProtocolException> {
        if (this.usingExternalBioAuth) {
            throw new ProtocolException(
                ProtocolErrorCode.NOT_IMPLEMENTED,
                'External Bio Auth implementations do not support fingerprint quality checks'
            );
        }

        try {
            const response = await this.bioAuthService.qualityCheck(agentIds);
            protocolException.details = protocolException.details || {};
            protocolException.details.bestPositions = response.data;
        } catch (ex) {
            Logger.error('Error calling Bio Auth Service fingerprint quality check', ex);
        }
        return protocolException;
    }

    /**
     * This verify logic is specific to when the service is configured to use an external Bio Auth Service rather than the one built by Protocol. It
     * expects that service to provide the externalId and externalIdType that was matched on as part of the response.
     */
    @ValidateParams
    private async verifyUsingExternalBioAuth(
        agentIds: string[],
        @IsValidInstance params: VerifyFingerprintImageDto,
        @IsValidInstance filters: VerifyFiltersDto
    ): Promise<VerifyResultDto> {
        const response = await this.bioAuthService.verifyFingerprint(params.position, params.image, agentIds, filters.externalIds);
        if (response.data.status !== 'matched') {
            throw new ProtocolException(
                ProtocolErrorCode.FINGERPRINT_NO_MATCH,
                'Fingerprint did not match stored records for citizen supplied through filters'
            );
        }
        return {
            status: response.data.status,
            id: response.data.externalId,
            idType: response.data.externalIdType
        };
    }

    /**
     * The verify logic involves calling verify against the Bio Auth Service, and then handling certain error codes by asking the Bio Auth Service for
     * the positions with the highest image quality
     * TODO - Update this after Bio Auth Service handles both these tasks in one call.
     */
    @ValidateParams
    public async verify(
        agentIds: string[],
        @IsValidInstanceOf(VerifyFingerprintImageDto, VerifyFingerprintTemplateDto) params: VerifyFingerprintImageDto | VerifyFingerprintTemplateDto,
        @IsValidInstance filters: VerifyFiltersDto
    ): Promise<VerifyResultDto> {
        if (this.usingExternalBioAuth) {
            return this.verifyUsingExternalBioAuth(agentIds, params as any, filters);
        }

        let response;
        try {
            if (VerifyFingerprintImageDto.isInstance(params)) {
                response = await this.bioAuthService.verifyFingerprint(params.position, params.image, agentIds, filters.externalIds);
            } else {
                response = await this.bioAuthService.verifyFingerprintTemplate(params.position, params.template, agentIds);
            }
        } catch(ex) {
            // Handle specific error codes
            switch (ex.code) {
                case ProtocolErrorCode.FINGERPRINT_NO_MATCH:
                case ProtocolErrorCode.FINGERPRINT_MISSING_NOT_CAPTURED:
                case ProtocolErrorCode.FINGERPRINT_MISSING_AMPUTATION:
                case ProtocolErrorCode.FINGERPRINT_MISSING_UNABLE_TO_PRINT:
                    if (process.env.QUALITY_CHECK_ENABLED === 'true') {
                        ex = await this.fingerprintQualityCheck(ex, agentIds.join(','));
                    }
                // no break, fall through
                default:
                    throw ex;
            }
        }

        //  Bio Auth Service should throw this error on no match, but just to be safe double check it and throw here
        if (response.data.status !== 'matched') {
            throw new ProtocolException(
                ProtocolErrorCode.FINGERPRINT_NO_MATCH,
                'Fingerprint did not match stored records for citizen supplied through filters'
            );
        }

        return {
            status: response.data.status,
            id: response.data.agentId
        };
    }

    public async save(agentId: string, params: BioAuthSaveParamsDto | BioAuthSaveParamsDto[]) {
        if (this.usingExternalBioAuth) {
            Logger.warn('With an external Bio Auth Service, the provided fingerprint is not actually saved.');
        } else {
            const data = Array.isArray(params) ? params : [params];
            const fingerprints: BioAuthSaveDto[] = data.map((param: BioAuthSaveParamsDto) => {
                return {agentId, params: param};
            });
            await this.bioAuthService.bulkSave({fingerprints});
        }
    }

}
