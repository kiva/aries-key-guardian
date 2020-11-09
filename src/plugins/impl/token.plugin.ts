import { IPlugin } from '../plugin.interface';
import { NotImplementedException } from '@nestjs/common';
import { TokenParamsDto } from '../../token/dto/token.params.dto';
import { TokenService } from '../../token/token.service';

export class TokenPlugin implements IPlugin {

    /**
     * Inject dependencies
     */
    constructor(private readonly tokenService: TokenService) {}

    /**
     * Pass call on to TokenService
     */
    public async verify(filters: any, params: TokenParamsDto): Promise<{ status, id }> {
        const id: string = await this.tokenService.verify(params);
        return {
            status: 'matched',
            id,
        };
    }

    /**
     * Not supported for token, would require using the token provider's admin api (e.g. Auth0) to inject the agentId into the user's metadata.
     */
    public async save(id: string, filters: any, params: any) {
        throw new NotImplementedException();
    }
}
