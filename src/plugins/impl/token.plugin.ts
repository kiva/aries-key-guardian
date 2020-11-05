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
     * Not supported for Auth0 token, doesn't even really make sense.
     */
    public async save(id: string, filters: any, params: any) {
        throw new NotImplementedException();
    }
}
