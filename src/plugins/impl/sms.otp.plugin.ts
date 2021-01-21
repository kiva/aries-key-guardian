import { IPlugin } from '../plugin.interface';
import { SmsService } from 'sms/sms.service';
import { VerifyFiltersDto } from '../dto/verify.filters.dto';

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
    public async verify(filters: VerifyFiltersDto, params: any) {
        return await this.smsService.verify(filters, params);
    }

    /**
     * Pass call onto sms service
     */
    public async save(id: string, params: any) {
        return await this.smsService.save(id, params);
    }
}
