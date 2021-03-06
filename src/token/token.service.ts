import { Injectable } from '@nestjs/common';
import { TokenParamsDto } from './dto/token.params.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import * as jwt from 'jsonwebtoken';
import { IJwksService } from '../remote/jwks.service.interface';
import { JsonWebTokenError } from 'jsonwebtoken';
import { Logger } from 'protocol-common/logger';

@Injectable()
export class TokenService {

    constructor(private readonly jwksService: IJwksService) {}

    /**
     * Verify the signature on the token and check for an id for the agent within the token.
     */
    public async verify(params: TokenParamsDto): Promise<string> {
        let agentId: string;

        // Decode & Verify the token
        try {
            const key = await this.jwksService.getKey(params.token);
            const pubKey: string = IJwksService.isCertSigningKey(key) ? key.publicKey : key.rsaPublicKey;
            Logger.info(pubKey);
            const token: any = jwt.verify(params.token, Buffer.from(pubKey, 'utf-8'), {
                algorithms: [process.env.JWT_SIGNATURE_ALGORITHM as any],
                complete: true
            });
            agentId = token.payload.agentId;
        } catch (e) {
            if (e instanceof JsonWebTokenError) {
                throw new ProtocolException(ProtocolErrorCode.INVALID_TOKEN, e.message);
            } else {
                throw e;
            }
        }

        // Verify the token's content actually contains an id for the agent and also contains the right id
        if (agentId == null) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_AGENT_ID, 'Token does not contain an agentId');
        } else {
            return agentId;
        }
    }
}
