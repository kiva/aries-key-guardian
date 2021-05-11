import { Injectable } from '@nestjs/common';
import { IJwksService } from '../jwks.service.interface';
import jwksClient, { JwksClient, SigningKey } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwksService implements IJwksService {

    private readonly client: JwksClient;

    constructor() {
        this.client = jwksClient({
            cache: true,
            jwksUri: `https://${process.env.JWKS_PROVIDER_DOMAIN}/.well-known/jwks.json`
        });
    }

    public async getKey(token: string): Promise<SigningKey> {
        const decoded: any = jwt.decode(token, {complete: true}) as any;
        return await this.client.getSigningKey(decoded.header.kid);
    }
}
