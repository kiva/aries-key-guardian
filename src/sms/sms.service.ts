import { Injectable } from '@nestjs/common';
import { SmsOtp } from '../db/entity/sms.otp.js';
import { SmsParamsDto } from './dto/sms.params.dto.js';
import { RateLimitService } from '../ratelimit/ratelimit.service.js';
import { RateLimitBucket } from '../ratelimit/ratelimit.bucket.js';
import { ISmsService } from '../remote/sms.service.interface.js';
import { SmsHelperService } from './sms.helper.service.js';
import { SmsOtpDbGateway } from '../db/sms.otp.db.gateway.js';
import { VerifyResultDto } from '../plugins/dto/verify.result.dto.js';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';

/**
 * Service to send an OTP via SMS and verify it
 */
@Injectable()
export class SmsService {

    constructor(
        private readonly smsService: ISmsService,
        private readonly rateLimitService: RateLimitService,
        private readonly smsHelperService: SmsHelperService,
        private readonly smsOtpDbGateway: SmsOtpDbGateway
    ) {}

    /**
     * If passed a phone number send the SMS OTP
     * If passed an otp, verify it
     */
    public async verify(agentIds: string[], params: SmsParamsDto): Promise<VerifyResultDto> {

        if (agentIds.some((id: string) => id !== agentIds[0])) {
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, 'Provided filters did not uniquely identify an agentId');
        }
        const agentId: string = agentIds[0];

        await this.rateLimit(agentId, params);

        if (params.phoneNumber) {
            return await this.sendSmsOtp(agentId, params.phoneNumber);
        } else {
            return await this.verifyOtp(agentId, params.otp);
        }
    }

    /**
     * Apply rate limiting rules based on the authorization header of the requestor and the id verification is based around.
     */
    private async rateLimit(id: string, params: SmsParamsDto): Promise<void> {
        const bucket = params.phoneNumber ? RateLimitBucket.SEND_OTP : RateLimitBucket.VERIFY_OTP;

        const attempt = async (key: string) => {
            await this.rateLimitService.addAttempt(bucket, key);
            if (await this.rateLimitService.shouldLimit(bucket, key)) {
                throw new ProtocolException(
                    ProtocolErrorCode.TOO_MANY_ATTEMPTS,
                    'Too many OTP verification attempts. Please wait awhile and try again'
                );
            }
        };

        if (params.authorization) {
            await attempt(params.authorization);
        }
        await attempt(id);
    }

    /**
     * Checks the phone number against stored records, generates an OTP and sends it
     */
    private async sendSmsOtp(agentId: string, phoneNumber: string): Promise<VerifyResultDto> {
        const otp = this.smsHelperService.generateRandomOtp();
        await this.smsOtpDbGateway.saveOtp(agentId, phoneNumber, otp);
        await this.smsService.sendOtp(phoneNumber, otp);
        return {
            status: 'sent',
            id: null,
        };
    }

    /**
     * Check if the passed in otp matches the stored one and clear out if needed
     */
    private async verifyOtp(agentId: string, otp: number): Promise<VerifyResultDto> {
        const smsOtp: SmsOtp  = (await this.smsOtpDbGateway.fetchSmsOtp(agentId));
        const otpMatches: boolean = smsOtp.otp === otp;
        const otpExpired: boolean = !smsOtp.otp_expiration_time || smsOtp.otp_expiration_time.valueOf() < Date.now();
        if (!otpMatches || otpExpired) {
            throw new ProtocolException(ProtocolErrorCode.OTP_NO_MATCH, 'The OTP either does not match or has expired.');
        }

        await this.smsOtpDbGateway.expireOtp(smsOtp);

        return {
            status: 'matched',
            id: smsOtp.agent_id,
        };
    }

    /**
     * Saves a phone number for later SMS OTP verification
     */
    public async save(id: string, params: SmsParamsDto) {
        await this.smsOtpDbGateway.savePhoneNumber(id, params.phoneNumber);
    }
}
