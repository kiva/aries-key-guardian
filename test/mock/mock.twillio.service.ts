import { ITwillioService } from '../../src/remote/twillio.service.interface';

export class MockTwillioService implements ITwillioService {

    async sendOtp(toNumber: string, otp: number): Promise<void> {
        return Promise.resolve(undefined);
    }
}