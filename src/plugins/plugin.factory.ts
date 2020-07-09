import { HttpService, Injectable, Optional } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { IPlugin } from './plugin.interface';
import { PluginTypeEnum } from './plugin.type.enum';
import { FingerprintPlugin } from './fingerprint.plugin';
import { SmsOtpPlugin } from './sms.otp.plugin';
import { SmsService } from '../sms/sms.service';

/**
 * Creates the specific plugin based on plugin type and handles passing in dependencies
 */
@Injectable()
export class PluginFactory {

    public readonly http: ProtocolHttpService;

    /**
     * We inject dependencies into the factory for things that will be needed by the plugins
     * These are set as optional so that in testing we can only inject the specific dependencies we need
     */
    constructor(
        @Optional() httpService?: HttpService,
        @Optional() public readonly smsService?: SmsService
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    public create(pluginType: string): IPlugin {
        switch (pluginType) {
            case PluginTypeEnum.FINGERPRINT:
                return new FingerprintPlugin(this.http);
            case PluginTypeEnum.SMS_OTP:
                return new SmsOtpPlugin(this.smsService);
            default:
                throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Unsupported plugin type');
        }
    }
}
