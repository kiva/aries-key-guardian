import { IPlugin } from '../plugin.interface';
import { SmsService } from 'sms/sms.service';
import { IsValidInstance } from 'protocol-common/validation/decorators/parameter/is.valid.instance.decorator';
import { ValidateParams } from 'protocol-common/validation/decorators/function/validate.params.decorator';
import { SmsParamsDto } from '../../sms/dto/sms.params.dto';
import { VerifyResultDto } from '../dto/verify.result.dto';

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
