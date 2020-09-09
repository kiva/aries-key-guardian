export abstract class ITwillioService {
    abstract async sendOtp(toNumber: string, otp: number): Promise<void>;
    abstract generateRandomOtp(): number;
}