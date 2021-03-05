import { InjectRepository } from '@nestjs/typeorm';
import { SmsOtp } from './entity/sms.otp';
import { Repository } from 'typeorm';
import { SecurityUtility } from 'protocol-common/security.utility';

export class SmsOtpService {

    constructor(
        @InjectRepository(SmsOtp)
        private readonly smsOtpRepository: Repository<SmsOtp>
    ) {}

    public fetchSmsOtp(did: string): Promise<SmsOtp | undefined> {
        return this.smsOtpRepository.findOne({did});
    }

    public savePhoneNumber(did: string, phoneNumber: string): Promise<SmsOtp> {
        const smsOtp = new SmsOtp();
        smsOtp.did = did;
        smsOtp.phone_number_hash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        try {
            return this.smsOtpRepository.save(smsOtp);
        } catch (e) {
            // Maybe we want some extra handling?
            throw e;
        }
    }

    public saveOtp(otp: number, smsOtp: SmsOtp): Promise<SmsOtp> {
        const otpExpirationTime = new Date(Date.now() + 15000); // 15 min
        const updatedSmsOtp: SmsOtp = {
            ...smsOtp,
            otp,
            otp_expiration_time: otpExpirationTime
        };
        return this.smsOtpRepository.save(updatedSmsOtp);
    }

    public expireOtp(smsOtp: SmsOtp): Promise<SmsOtp> {
        const expiredSmsOtp: SmsOtp = {
            ...smsOtp,
            otp: null,
            otp_expiration_time: null
        };
        return this.smsOtpRepository.save(expiredSmsOtp);
    }
}
