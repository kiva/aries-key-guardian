import { Injectable, Logger } from '@nestjs/common';
import { ISmsService } from '../sms.service.interface.js';

@Injectable()
export class SmsDisabledService implements ISmsService {
    sendOtp(toNumber: string, otp: number): Promise<void> {
        Logger.log(`Twillio integration is disabled. Your NDIP one-time passcode is ${otp}`);
        return Promise.resolve();
    }
}
