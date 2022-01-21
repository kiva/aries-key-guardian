import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { HttpService, Injectable } from '@nestjs/common';
import { IBioAuthService } from '../bio.auth.service.interface';
import { BioAuthBulkSaveDto } from '../dto/bio.auth.bulk.save.dto';
import { FingerprintTypeEnum } from '../fingerprint.type.enum';
import { ExternalId } from '../../db/entity/external.id';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

/**
 * This service class is a facade for the Bio Auth Service HTTP API.
 */
@Injectable()
export class BioAuthService implements IBioAuthService {

    private readonly baseUrl: string;
    private readonly http: ProtocolHttpService;
    private readonly isExternal: boolean;

    constructor(httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
        this.baseUrl = process.env.BIO_AUTH_SERVICE_URL;
        this.isExternal = process.env.EXTERNAL_BIO_AUTH === 'true';
    }

    private getIds(externalIds: ExternalId[]): string {
        return externalIds.map((externalId: ExternalId) => this.isExternal ? externalId.external_id : externalId.agent_id).join(',');
    }

    private restrictToInternal(operation: string) {
        if (this.isExternal) {
            throw new ProtocolException(ProtocolErrorCode.NOT_IMPLEMENTED, `External Bio Auth implementations do not support ${operation}`);
        }
    }

    /**
     * Send a request to Bio Auth Service to verify a fingerprint image.
     * TODO: Update the request to Bio Auth Service to accept "ids" instead of "agentIds"
     *
     * @param position The position of the finger that the fingerprint template refers to.
     * @param image The image of the fingerprint.
     * @param externalIds The ID(s) that the fingerprint may correspond to.
     */
    public async verifyFingerprint(position: number, image: string, externalIds: ExternalId[]): Promise<any> {
        const ids: string = this.getIds(externalIds);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/api/v1/verify`,
            data: {
                params: {
                    position,
                    image
                },
                filters: this.isExternal ? {ids} : {agentIds: ids}
            },
        };
        return this.http.requestWithRetry(request);
    }

    /**
     * Send a request to Bio Auth Service to verify a fingerprint template.
     *
     * @param position The position of the finger that the fingerprint template refers to.
     * @param template The template of the fingerprint.
     * @param externalIds The ID(s) that the fingerprint may correspond to.
     */
    public async verifyFingerprintTemplate(position: number, template: string, externalIds: ExternalId[]): Promise<any> {
        this.restrictToInternal('template-based fingerprint verification');
        const ids: string = this.getIds(externalIds);
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/api/v1/verify`,
            data: {
                params: {
                    position,
                    image: template
                },
                filters: {
                    agentIds: ids
                },
                imageType: FingerprintTypeEnum.TEMPLATE,
            },
        };
        return this.http.requestWithRetry(request);
    }

    /**
     * Send a request to Bio Auth Service to save one or more fingerprints. They may be fingerprint templates or images.
     *
     * @param dto Body of the request to be sent to Bio Auth Service. See the class definition for the shape.
     */
    public async bulkSave(dto: BioAuthBulkSaveDto): Promise<any> {
        this.restrictToInternal('saving new fingerprint(s)');
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/api/v1/save`,
            data: dto,
        };
        return this.http.requestWithRetry(request);
    }

    /**
     * Queries the Bio Auth Service to get the finger positions with the best quality scores
     */
    public async qualityCheck(agentIds: string): Promise<any> {
        this.restrictToInternal('fingerprint quality check');
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: `${this.baseUrl}/api/v1/positions`,
            data: {
                agentIds
            }
        };
        return this.http.requestWithRetry(request);
    }
}
