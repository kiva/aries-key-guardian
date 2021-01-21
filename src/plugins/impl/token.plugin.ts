import { IPlugin } from '../plugin.interface';
import { NotImplementedException } from '@nestjs/common';
import { TokenParamsDto } from '../../token/dto/token.params.dto';
import { TokenService } from '../../token/token.service';
import { VerifyFiltersDto } from '../dto/verify.filters.dto';

export class TokenPlugin implements IPlugin {

    /**
     * Inject dependencies
     */
    constructor(private readonly tokenService: TokenService) {}

    /**
     * Pass call on to TokenService
     */
    public async verify(filters: VerifyFiltersDto, params: TokenParamsDto): Promise<{ status, id }> {
        const id: string = await this.tokenService.verify(params);
        return {
            status: 'matched',
            id,
        };
    }

    /**
     * Not supported for token, would require using the token provider's admin api (e.g. Auth0) to inject the did into the user's metadata.
     */
    public async save(id: string, params: any) {
        throw new NotImplementedException();
    }
}
