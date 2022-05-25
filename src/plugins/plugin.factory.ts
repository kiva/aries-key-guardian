import { Injectable, Optional } from '@nestjs/common';
import { IPlugin } from './plugin.interface.js';
import { PluginTypeEnum } from './plugin.type.enum.js';
import { FingerprintPlugin } from './impl/fingerprint.plugin.js';
import { SmsOtpPlugin } from './impl/sms.otp.plugin.js';
import { SmsService } from '../sms/sms.service.js';
import { IBioAuthService } from '../remote/bio.auth.service.interface.js';
import { TokenPlugin } from './impl/token.plugin.js';
import { TokenService } from '../token/token.service.js';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';

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
        @Optional() private readonly smsService?: SmsService
    ) {}

    public create(pluginType: string): IPlugin {
        switch (pluginType) {
            case PluginTypeEnum.FINGERPRINT:
                return new FingerprintPlugin(this.bioAuthService);
            case PluginTypeEnum.SMS_OTP:
                return new SmsOtpPlugin(this.smsService);
            case PluginTypeEnum.TOKEN:
                return new TokenPlugin(this.tokenService);
            default:
                throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Unsupported plugin type');
        }
    }
}
