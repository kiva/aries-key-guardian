import { IPlugin } from './plugin.interface';
import { AxiosRequestConfig } from 'axios';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';

/**
 * Right now the backend (ie which fingerprint template db to connect to) is defined by an environment variable, eventually we'll want this to
 * be set in a country profile, so the process of setting the backend will change.
 */
export class FingerprintPlugin implements IPlugin {

    private backend: string;

    /**
     * We pass in the parent class as context so we can access the http module
     */
    constructor(private readonly http: ProtocolHttpService) {
        this.backend = process.env.IDENTITY_SERVICE_BACKEND;
    }

    /**
     * TODO right now this keeps the identity service url the same, we probably want to change that so it better matches our plugin pattern
     */
    public async verify(filters: any, params: any){
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.IDENTITY_SERVICE_URL + '/api/v1/verify',
            data: {
                backend: this.backend,
                position: params.position,
                image: params.image,
                filters,
            },
        };
        const response = await this.http.requestWithRetry(request);

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

    /**
     * Currently this isn't called because the wallet sync service calls the identity service directly
     * Eventually we want all calls to plugin services to be proxied through here
     * TODO the identity service should update the templatizer endpoint to accept data in this format
     */
    public async save(id: string, filters: any, params: any) {
        const request: AxiosRequestConfig = {
            method: 'POST',
            url: process.env.IDENTITY_SERVICE_URL + '/api/v1/templatizer/bulk/' + this.backend,
            data: {
                id,
                filters,
                params,
            },
        };
        await this.http.requestWithRetry(request);
    }
}
