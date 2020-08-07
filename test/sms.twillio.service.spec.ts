import { TwillioService } from '../src/sms/twillio.service';

describe ('SMS Twillio Service', () => {

    const service: TwillioService = new TwillioService();

    // Note: This is a probabilistic test and does not guarantee the behavior of the function
    it('generateRandomOtp() should generate valid OTPs', () => {
        for (let i = 0; i < 10000; i++) {
            const otp: number = service.generateRandomOtp();
            expect(otp).toBeGreaterThan(99999); // Must be at least 6 digits
            expect(otp).toBeLessThan(1000000); // Must be no more than 6 digits
        }
    });
});