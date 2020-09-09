import { IPlugin } from './plugin.interface';
import { SmsService } from 'sms/sms.service';

/**
 * For simplicity the SMS plugin isn't a separate microservice, it's just a module inside this service
 */
export class SmsOtpPlugin implements IPlugin {

    /**
     * Inject dependencies
     */
    constructor(private readonly smsService: SmsService) { }

    /**
     * Pass call onto remote service
     */
    public async verify(filters: any, params: any) {
        return await this.smsService.verify(filters, params);
    }

    /**
     * Pass call onto remote service
     */
    public async save(id: string, filters: any, params: any) {
        return await this.smsService.save(id, filters, params);
    }
}
