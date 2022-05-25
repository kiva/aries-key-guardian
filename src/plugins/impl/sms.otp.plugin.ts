import { IPlugin } from '../plugin.interface.js';
import { SmsService } from 'sms/sms.service.js';
import { SmsParamsDto } from '../../sms/dto/sms.params.dto.js';
import { VerifyResultDto } from '../dto/verify.result.dto.js';
import { IsValidInstance, ValidateParams } from 'protocol-common/validation';

/**
 * For simplicity the SMS plugin isn't a separate microservice, it's just a module inside this service
 */
export class SmsOtpPlugin implements IPlugin {

    /**
     * Inject dependencies
     */
    constructor(private readonly smsService: SmsService) { }

    /**
     * Pass call onto sms service
     */
    @ValidateParams
    public async verify(agentIds: string[], @IsValidInstance params: SmsParamsDto): Promise<VerifyResultDto> {
        return await this.smsService.verify(agentIds, params);
    }

    /**
     * Pass call onto sms service
     */
    @ValidateParams
    public async save(id: string, @IsValidInstance params: SmsParamsDto) {
        return await this.smsService.save(id, params);
    }
}
