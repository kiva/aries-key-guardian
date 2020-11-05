import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { HttpService, Injectable } from '@nestjs/common';
import { IIdentityService } from '../identity.service.interface';

/**
 * This service class is a facade for the IdentityService HTTP API.
 *
 * Right now the backend (ie which fingerprint template db to connect to) is defined by an environment variable, eventually we'll want this to
 * be set in a country profile, so the process of setting the backend will change.
 */
@Injectable()
export class IdentityService implements IIdentityService {

    private readonly backend: string;
    private readonly baseUrl: string;
    private readonly http: ProtocolHttpService;

    constructor(httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
        this.backend = process.env.IDENTITY_SERVICE_BACKEND;
        this.baseUrl = process.env.IDENTITY_SERVICE_URL;
    }

    /**
     * TODO right now this keeps the identity service url the same, we probably want to change that so it better matches our plugin pattern
     */
    public async verify(position: number, image: string, filters: any): Promise<any> {
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: this.baseUrl + '/api/v1/verify',
            data: {
                backend: this.backend,
                position,
                image,
                filters,
            },
        };
        return this.http.requestWithRetry(request);
    }

    /**
     * TODO the identity service should update the templatizer endpoint to accept data in the format { id, filters, params }
     *   Until it does, we just forward the params as the data it's currently expecting
     */
    public async templatize(data: any): Promise<any> {
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: this.baseUrl + '/api/v1/templatizer/bulk/' + this.backend,
            data,
        };
        return this.http.requestWithRetry(request);
    }

    /**
     * Queries the identity service to get the finger positions with the best quality scores
     * TODO the identity service should update the positions endpoint to accept data in the body instead of via url params
     */
    public async qualityCheck(filters: any): Promise<any> {
        const filterKey = Object.keys(filters)[0];
        const params = `${filterKey}=${filters[filterKey]}`;
        const request: AxiosRequestConfig = {
            method: 'GET',
            url: this.baseUrl + '/api/v1/positions/' + this.backend + '/' + params,
        };
        return this.http.requestWithRetry(request);
    }
}
