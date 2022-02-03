import { Injectable, Optional, HttpService } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { IPlugin } from './plugin.interface';
import { PluginTypeEnum } from './plugin.type.enum';
import { FingerprintPlugin } from './impl/fingerprint.plugin';
import { SmsOtpPlugin } from './impl/sms.otp.plugin';
import { SmsService } from '../sms/sms.service';
import { IBioAuthService } from '../remote/bio.auth.service.interface';
import { TokenPlugin } from './impl/token.plugin';
import { TokenService } from '../token/token.service';
import { ExternalIdDbGateway } from '../db/external.id.db.gateway';
import { IExternalControllerService } from '../remote/external.controller.service.interface';

/**
 * Creates the specific plugin based on plugin type and handles passing in dependencies
 */
@Injectable()
export class PluginFactory {

    /**
     * We inject dependencies into the factory for things that will be needed by the plugins
     * These are set as optional so that in testing we can only inject the specific dependencies we need
     */
    constructor(
        @Optional() private readonly bioAuthService?: IBioAuthService,
        @Optional() private readonly tokenService?: TokenService,
        @Optional() private readonly smsService?: SmsService,
        @Optional() private readonly externalIdDbGateway?: ExternalIdDbGateway,
        @Optional() private readonly externalService?: IExternalControllerService
    ) {}

    public create(pluginType: string): IPlugin {
        switch (pluginType) {
            case PluginTypeEnum.FINGERPRINT:
                return new FingerprintPlugin(this.bioAuthService, this.externalIdDbGateway, this.externalService);
            case PluginTypeEnum.SMS_OTP:
                return new SmsOtpPlugin(this.smsService);
            case PluginTypeEnum.TOKEN:
                return new TokenPlugin(this.tokenService);
            default:
                throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Unsupported plugin type');
        }
    }
}
