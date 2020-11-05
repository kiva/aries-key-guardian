import { Injectable } from '@nestjs/common';
import { TokenParamsDto } from './dto/token.params.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import jwksClient, { CertSigningKey, SigningKey, JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TokenService {

    private readonly client: JwksClient;

    constructor() {
        this.client = jwksClient({
            cache: true,
            jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
        });
    }

    /**
     * Verify the signature on the token and check for an id for the agent within the token.
     */
    public async verify(params: TokenParamsDto): Promise<string> {

        // Decode & Verify the token
        const token: any = jwt.decode(params.token, {complete: true}) as any;
        const key: SigningKey = await this.client.getSigningKeyAsync(token.header.kid);
        const pubKey: string = TokenService.isCertSigningKey(key) ? key.publicKey : key.rsaPublicKey;
        jwt.verify(params.token, pubKey);

        // Verify the token's content actually contains an id for the agent
        if (token.payload.agentId) {
            return token.payload.agentId;
        } else {
            throw new ProtocolException(ProtocolErrorCode.MISSING_AGENT_ID, 'Token does not contain an agentId');
        }
    }

    private static isCertSigningKey(key: SigningKey): key is CertSigningKey {
        return (key as CertSigningKey).publicKey !== undefined;
    }
}
