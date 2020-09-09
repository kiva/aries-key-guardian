import { ITwillioService } from '../../src/remote/twillio.service.interface';

export class MockTwillioService implements ITwillioService {

    constructor(private readonly otp: number) {}

    generateRandomOtp(): number {
        return this.otp;
    }

    async sendOtp(toNumber: string, otp: number): Promise<void> {
        return Promise.resolve(undefined);
    }
}