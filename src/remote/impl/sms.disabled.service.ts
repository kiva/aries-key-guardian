import { Injectable } from '@nestjs/common';
import { ISmsService } from '../sms.service.interface';
import { Logger } from 'protocol-common/logger';

@Injectable()
export class SmsDisabledService implements ISmsService {
    async sendOtp(toNumber: string, otp: number): Promise<void> {
        Logger.log(`Twillio integration is disabled. Your NIDP one-time passcode is ${otp}`);
    }
}
