import { Injectable } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SecurityUtility } from 'protocol-common/security.utility';
import { SmsOtp } from '../db/entity/sms.otp';
import { SmsParamsDto } from './dto/sms.params.dto';
import { RateLimitService } from '../ratelimit/ratelimit.service';
import { RateLimitBucket } from '../ratelimit/ratelimit.bucket';
import { ISmsService } from '../remote/sms.service.interface';
import { SmsHelperService } from './sms.helper.service';
import { ExternalId } from '../db/entity/external.id';
import { VerifyFiltersDto } from '../plugins/dto/verify.filters.dto';
import { ExternalIdService } from '../db/external.id.service';
import { SmsOtpService } from '../db/sms.otp.service';

/**
 * Service to send an OTP via SMS and verify it
 */
@Injectable()
export class SmsService {

    constructor(
        private readonly smsService: ISmsService,
        private readonly rateLimitService: RateLimitService,
        private readonly smsHelperService: SmsHelperService,
        private readonly externalIdService: ExternalIdService,
        private readonly smsOtpService: SmsOtpService
    ) {}

    /**
     * If passed a phone number send the SMS OTP
     * If passed an otp, verify it
     */
    public async verify(filters: VerifyFiltersDto, params: SmsParamsDto): Promise<{ status, id }> {

        const externalIds: ExternalId[] = await this.externalIdService.fetchExternalIds(VerifyFiltersDto.getIds(filters));
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
    private async sendSmsOtp(did: string, phoneNumber: any) {
        const smsOtpEntity = await this.findSmsOtpEntity(did);
        if (!smsOtpEntity.phone_number_hash) {
            throw new ProtocolException(ProtocolErrorCode.NO_PHONE_NUMBER, 'No phone number stored for citizen');
        }

        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        if (smsOtpEntity.phone_number_hash !== phoneNumberHash) {
            throw new ProtocolException(ProtocolErrorCode.PHONE_NUMBER_NO_MATCH, 'Phone number doesn\'t match for stored citizen');
        }

        const otp = await this.generateOtp(smsOtpEntity);
        await this.smsService.sendOtp(phoneNumber, otp);
        return {
            status: 'sent',
            id: null,
        };
    }

    /**
     * Looks up the SMS OTP entity by passed in gov ids
     */
    private async findSmsOtpEntity(did: string): Promise<SmsOtp> {
        const result = await this.smsOtpService.fetchSmsOtp(did);
        if (!result) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No citizen found for given filters');
        }
        return result;
    }

    /**
     * Generate an OTP and save it for future verification
     * @tothink maybe we should only save a OTP if the SMS sends successfully
     */
    private async generateOtp(smsOtp: SmsOtp): Promise<number> {
        const otp = this.smsHelperService.generateRandomOtp();
        const expiringSmsOtp = await this.smsOtpService.saveOtp(otp, smsOtp);
        this.scheduleOtpExpiration(expiringSmsOtp);
        return otp;
    }

    /**
     * Check if the passed in otp matches the stored one and clear out if needed
     */
    private async verifyOtp(id: string, otp: number) {
        const smsOtp = await this.findSmsOtpEntity(id);
        if (!smsOtp.otp) {
            throw new ProtocolException(ProtocolErrorCode.OTP_EXPIRED, 'The OTP has expired, please send again');
        }
        if (smsOtp.otp !== otp) {
            throw new ProtocolException(ProtocolErrorCode.OTP_NO_MATCH, 'The OTP does not match');
        }

        await this.smsOtpService.expireOtp(smsOtp);

        return {
            status: 'matched',
            id: smsOtp.did,
        };
    }

    /**
     * Kicks off a timed job to expire the OTP in 15 min
     * To make this more robust we could add a cron job that double checks expiration times, or move stored OTPs to a cache
     */
    private scheduleOtpExpiration(smsOtpEntity: SmsOtp): void {
        setTimeout(
            async () => {
                await this.smsOtpService.expireOtp(smsOtpEntity);
            },
            parseInt(process.env.OTP_EXPIRE_MS, 10),
        );
    }

    /**
     * Saves a phone number for later SMS OTP verification
     */
    public async save(id: string, params: SmsParamsDto) {
        await this.smsOtpService.savePhoneNumber(id, params.phoneNumber);
    }
}
