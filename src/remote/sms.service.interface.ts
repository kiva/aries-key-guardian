export abstract class ISmsService {
    abstract async sendOtp(toNumber: string, otp: number): Promise<void>;
}
