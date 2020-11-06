import { Injectable } from '@nestjs/common';
import { TokenParamsDto } from './dto/token.params.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import * as jwt from 'jsonwebtoken';
import { IJwksService } from '../remote/jwks.service.interface';
import { JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class TokenService {

    constructor(private readonly jwksService: IJwksService) {}

    /**
     * Verify the signature on the token and check for an id for the agent within the token.
     */
    public async verify(params: TokenParamsDto): Promise<string> {
        try {
            // Decode & Verify the token
            const key = await this.jwksService.getKey(params.token);
            const pubKey: string = IJwksService.isCertSigningKey(key) ? key.publicKey : key.rsaPublicKey;
            const token: any = jwt.verify(params.token, new Buffer(pubKey, 'base64'), {
                algorithms: [process.env.AUTH0_ALGORITHM as any],
                complete: true
            });

            // Verify the token's content actually contains an id for the agent
            if (token.payload.agentId) {
                return token.payload.agentId;
            } else {
                throw new ProtocolException(ProtocolErrorCode.MISSING_AGENT_ID, 'Token does not contain an agentId');
            }
        } catch (e) {
            if (e instanceof JsonWebTokenError) {
                throw new ProtocolException(ProtocolErrorCode.INVALID_TOKEN, e.message);
            } else {
                throw e;
            }
        }
    }
}
