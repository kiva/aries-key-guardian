export abstract class ISmsService {
    abstract sendOtp(toNumber: string, otp: number): Promise<void>;
}
