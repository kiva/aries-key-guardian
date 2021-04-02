import { Injectable } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SmsOtp } from '../db/entity/sms.otp';
import { SmsParamsDto } from './dto/sms.params.dto';
import { RateLimitService } from '../ratelimit/ratelimit.service';
import { RateLimitBucket } from '../ratelimit/ratelimit.bucket';
import { ISmsService } from '../remote/sms.service.interface';
import { SmsHelperService } from './sms.helper.service';
import { ExternalId } from '../db/entity/external.id';
import { VerifyFiltersDto } from '../plugins/dto/verify.filters.dto';
import { ExternalIdDbGateway } from '../db/external.id.db.gateway';
import { SmsOtpDbGateway } from '../db/sms.otp.db.gateway';

/**
 * Service to send an OTP via SMS and verify it
 */
@Injectable()
export class SmsService {

    constructor(
        private readonly smsService: ISmsService,
        private readonly rateLimitService: RateLimitService,
        private readonly smsHelperService: SmsHelperService,
        private readonly externalIdDbGateway: ExternalIdDbGateway,
        private readonly smsOtpDbGateway: SmsOtpDbGateway
    ) {}

    /**
     * If passed a phone number send the SMS OTP
     * If passed an otp, verify it
     */
    public async verify(filters: VerifyFiltersDto, params: SmsParamsDto): Promise<{ status, id }> {

        const externalIds: ExternalId[] = await this.externalIdDbGateway.fetchExternalIds(VerifyFiltersDto.getIds(filters));
        if (externalIds.some((id: ExternalId) => id.did !== externalIds[0].did)) {
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, 'Provided filters did not uniquely identity a did');
        }
        const did: string = externalIds[0].did;

        await this.rateLimit(did, params);

        if (params.phoneNumber) {
            return await this.sendSmsOtp(did, params.phoneNumber);
        } else {
            return await this.verifyOtp(did, params.otp);
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
                throw new ProtocolException(ProtocolErrorCode.TOO_MANY_ATTEMPTS, 'Too many OTP verification attempts. Please wait awhile and try again');
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
    private async sendSmsOtp(did: string, phoneNumber: string) {
        const otp = this.smsHelperService.generateRandomOtp();
        await this.smsOtpDbGateway.saveOtp(did, phoneNumber, otp);
        await this.smsService.sendOtp(phoneNumber, otp);
        return {
            status: 'sent',
            id: null,
        };
    }

    /**
     * Check if the passed in otp matches the stored one and clear out if needed
     */
    private async verifyOtp(did: string, otp: number) {
        const smsOtp: SmsOtp  = (await this.smsOtpDbGateway.fetchSmsOtp(did));
        const otpMatches: boolean = smsOtp.otp === otp;
        const otpExpired: boolean = !smsOtp.otp_expiration_time || smsOtp.otp_expiration_time.valueOf() < Date.now();
        if (!otpMatches || otpExpired) {
            throw new ProtocolException(ProtocolErrorCode.OTP_NO_MATCH, 'The OTP either does not match or has expired.');
        }

        await this.smsOtpDbGateway.expireOtp(smsOtp);

        return {
            status: 'matched',
            id: smsOtp.did,
        };
    }

    /**
     * Saves a phone number for later SMS OTP verification
     */
    public async save(id: string, params: SmsParamsDto) {
        await this.smsOtpDbGateway.savePhoneNumber(id, params.phoneNumber);
    }
}
