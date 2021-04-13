import { IPlugin } from '../plugin.interface';
import { TokenParamsDto } from '../../token/dto/token.params.dto';
import { TokenService } from '../../token/token.service';
import { IsValidInstance } from 'protocol-common/validation/decorators/parameter/is.valid.instance.decorator';
import { ValidateParams } from 'protocol-common/validation/decorators/function/validate.params.decorator';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

export class TokenPlugin implements IPlugin {

    /**
     * Inject dependencies
     */
    constructor(private readonly tokenService: TokenService) {}

    /**
     * Pass call on to TokenService
     */
    @ValidateParams
    public async verify(@IsValidInstance params: TokenParamsDto): Promise<{ status, id }> {
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
        throw new ProtocolException(ProtocolErrorCode.NOT_IMPLEMENTED, 'Save endpoint not supported for tokens');
    }
}
