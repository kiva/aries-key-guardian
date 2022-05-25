import { Injectable, Logger } from '@nestjs/common';
import { TokenParamsDto } from './dto/token.params.dto.js';
import jwt from 'jsonwebtoken';
import { IJwksService } from '../remote/jwks.service.interface.js';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';

@Injectable()
export class TokenService {

    constructor(private readonly jwksService: IJwksService) {}

    /**
     * Verify the signature on the token and check for an id for the agent within the token.
     */
    public async verify(agentIds: string[], params: TokenParamsDto): Promise<string> {
        let agentId: string;

        // Decode & Verify the token
        try {
            const key = await this.jwksService.getKey(params.token);
            const pubKey: string = IJwksService.isCertSigningKey(key) ? key.publicKey : key.rsaPublicKey;
            Logger.log(pubKey);
            const token: any = jwt.verify(params.token, Buffer.from(pubKey, 'utf-8'), {
                algorithms: [process.env.JWT_SIGNATURE_ALGORITHM as any],
                complete: true
            });
            agentId = token.payload.agentId;
        } catch (e) {
            if (e instanceof jwt.JsonWebTokenError) {
                throw new ProtocolException(ProtocolErrorCode.INVALID_TOKEN, e.message);
            } else {
                throw e;
            }
        }

        // Verify the token's content actually contains an id for the agent and also contains the right id
        if (agentId == null) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_AGENT_ID, 'Token does not contain an agentId');
        } else if (!agentIds.some((id: string) => id === agentId)) {
            throw new ProtocolException(ProtocolErrorCode.INVALID_TOKEN, 'Token does not contain a valid agentId');
        } else {
            return agentId;
        }
    }
}
