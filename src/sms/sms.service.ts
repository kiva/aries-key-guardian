import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SecurityUtility } from 'protocol-common/security.utility';
import { SmsOtp } from '../db/entity/sms.otp';
import { SmsErrorCode } from './sms.errorcode';
import { SmsParamsDto } from './dto/sms.params.dto';
import { RateLimitService } from '../ratelimit/ratelimit.service';
import { RateLimitBucket } from '../ratelimit/ratelimit.bucket';
import { ISmsService } from '../remote/sms.service.interface';
import { SmsHelperService } from './sms.helper.service';
import { ExternalId } from '../db/entity/external.id';
import { ExternalIdService } from '../db/external.id.service';
import { VerifyFiltersDto } from '../plugins/dto/verify.filters.dto';

/**
 * Service to send an OTP via SMS and verify it
 */
@Injectable()
export class SmsService {

    constructor(
        @InjectRepository(SmsOtp)
        private readonly smsOtpRepository: Repository<SmsOtp>,
        private readonly smsService: ISmsService,
        private readonly rateLimitService: RateLimitService,
        private readonly smsHelperService: SmsHelperService,
        private readonly externalIdService: ExternalIdService
    ) {}

    /**
     * If passed a phone number send the SMS OTP
     * If passed an otp, verify it
     */
    public async verify(filters: VerifyFiltersDto, params: SmsParamsDto): Promise<{ status, id }> {

        const externalId: ExternalId = await this.externalIdService.fetchExternalId(filters);
        const did: string = externalId.did;

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
                throw new ProtocolException(SmsErrorCode.TOO_MANY_ATTEMPTS, 'Too many OTP verification attempts. Please wait awhile and try again');
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
            throw new ProtocolException(SmsErrorCode.NO_PHONE_NUMBER, 'No phone number stored for citizen');
        }

        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        if (smsOtpEntity.phone_number_hash !== phoneNumberHash) {
            throw new ProtocolException(SmsErrorCode.PHONE_NUMBER_NO_MATCH, 'Phone number doesn\'t match for stored citizen');
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
        const results = await this.smsOtpRepository.find({did});
        if (results.length < 1) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No citizen found for given filters');
        }
        return results[0];
    }

    /**
     * Generate an OTP and save it for future verification
     * @tothink maybe we should only save a OTP if the SMS sends successfully
     */
    private async generateOtp(smsOtpEntity: SmsOtp): Promise<number> {
        const otp = this.smsHelperService.generateRandomOtp();
        const otpExpireTime = new Date(Date.now() + 15000); // 15 min
        smsOtpEntity.otp = otp;
        smsOtpEntity.otp_expiration_time = otpExpireTime;
        await this.smsOtpRepository.save(smsOtpEntity);
        this.scheduleOtpExpiration(smsOtpEntity);
        return otp;
    }

    /**
     * Check if the passed in otp matches the stored one and clear out if needed
     */
    private async verifyOtp(id: string, otp: number) {
        const smsOtpEntity = await this.findSmsOtpEntity(id);
        if (!smsOtpEntity.otp) {
            throw new ProtocolException(SmsErrorCode.OTP_EXPIRED, 'The OTP has expired, please send again');
        }
        if (smsOtpEntity.otp !== otp) {
            throw new ProtocolException(SmsErrorCode.OTP_NO_MATCH, 'The OTP does not match');
        }

        smsOtpEntity.otp = null;
        smsOtpEntity.otp_expiration_time = null;
        await this.smsOtpRepository.save(smsOtpEntity);

        return {
            status: 'matched',
            id: smsOtpEntity.did,
        };
    }

    /**
     * Kicks off a timed job to expire the OTP in 15 min
     * To make this more robust we could add a cron job that double checks expiration times, or move stored OTPs to a cache
     */
    public scheduleOtpExpiration(smsOtpEntity: SmsOtp): void {
        setTimeout(
            async () => {
                const expiredSmsOtp: SmsOtp = {
                    ...smsOtpEntity,
                    otp: null,
                    otp_expiration_time: null
                };
                await this.smsOtpRepository.save(expiredSmsOtp);
            },
            parseInt(process.env.OTP_EXPIRE_MS, 10),
        );
    }

    /**
     * Saves a phone number for later SMS OTP verification
     */
    public async save(id: string, params: SmsParamsDto) {
        const smsOtpEntity = new SmsOtp();
        smsOtpEntity.did = id;
        smsOtpEntity.phone_number_hash = SecurityUtility.hash32(params.phoneNumber + process.env.HASH_PEPPER);
        try {
            await this.smsOtpRepository.save(smsOtpEntity);
        } catch (e) {
            // Maybe we want some extra handling?
            throw e;
        }
    }
}
