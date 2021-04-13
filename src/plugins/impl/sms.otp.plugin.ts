import { IPlugin } from '../plugin.interface';
import { SmsService } from 'sms/sms.service';
import { VerifyFiltersDto } from '../dto/verify.filters.dto';
import { IsValidInstance } from 'protocol-common/validation/decorators/parameter/is.valid.instance.decorator';
import { ValidateParams } from 'protocol-common/validation/decorators/function/validate.params.decorator';
import { SmsParamsDto } from '../../sms/dto/sms.params.dto';

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
    public async verify(@IsValidInstance params: SmsParamsDto, @IsValidInstance filters: VerifyFiltersDto) {
        return await this.smsService.verify(params, filters);
    }

    /**
     * Pass call onto sms service
     */
    @ValidateParams
    public async save(id: string, @IsValidInstance params: SmsParamsDto) {
        return await this.smsService.save(id, params);
    }
}
