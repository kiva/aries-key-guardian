import { SmsHelperService } from './sms.helper.service.js';

export class MockSmsHelperService extends SmsHelperService {
    constructor(private readonly otp?: number) {
        super();
    }

    generateRandomOtp(): number {
        return this.otp ?? super.generateRandomOtp();
    }
}
