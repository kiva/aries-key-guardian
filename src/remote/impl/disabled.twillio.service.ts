import { Injectable } from '@nestjs/common';
import { ITwillioService } from '../twillio.service.interface';
import { Logger } from 'protocol-common/logger';

@Injectable()
export class DisabledTwillioService implements ITwillioService {
    async sendOtp(toNumber: string, otp: number): Promise<void> {
        Logger.log(`Twillio integration is disabled. Your NIDP one-time passcode is ${otp}`);
    }
}
