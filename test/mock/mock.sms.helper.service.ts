import { SmsHelperService } from '../../src/sms/sms.helper.service';

export class MockSmsHelperService extends SmsHelperService {
    constructor(private readonly otp?: number) {
        super();
    }

    generateRandomOtp(): number {
        return this.otp ?? super.generateRandomOtp();
    }
}
