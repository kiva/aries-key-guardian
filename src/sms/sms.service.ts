import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SecurityUtility } from 'protocol-common/security.utility';
import { SmsOtp } from '../entity/sms.otp';
import { SmsErrorCode } from './sms.errorcode';
import { TwillioService } from './twillio.service';
import { SmsFiltersDto } from './dtos/sms.filters.dto';
import { SmsParamsDto } from './dtos/sms.params.dto';
import { RateLimitService } from '../ratelimit/ratelimit.service';
import { RateLimitBucket } from '../ratelimit/ratelimit.bucket';

/**
 * Service to send an OTP via SMS and verify it
 */
@Injectable()
export class SmsService {

    constructor(
        @InjectRepository(SmsOtp)
        private readonly smsOtpRepository: Repository<SmsOtp>,
        private readonly twillioService: TwillioService,
        private readonly rateLimitService: RateLimitService
    ) {}

    /**
     * If passed a phone number send the SMS OTP
     * If passed an otp, verify it
     */
    public async verify(filters: SmsFiltersDto, params: SmsParamsDto): Promise<{ status, id }> {
        if (params.phoneNumber) {
            await this.rateLimit(RateLimitBucket.SEND_OTP, filters);
            return await this.sendSmsOtp(filters, params.phoneNumber);
        } else {
            await this.rateLimit(RateLimitBucket.VERIFY_OTP, filters);
            return await this.verifyOtp(filters, params.otp);
        }
    }

    private async rateLimit(bucket: RateLimitBucket, filters: SmsFiltersDto): Promise<void> {
        const key = filters.govId1 ? `govId1${filters.govId1}` : `govId2${filters.govId2}`;
        await this.rateLimitService.addAttempt(bucket, key);
        if (await this.rateLimitService.shouldLimit(bucket, key)) {
            throw new ProtocolException(SmsErrorCode.TOO_MANY_ATTEMPTS, 'Too many OTP verification attempts. Please wait awhile and try again');
        }
    }

    /**
     * Checks the phone number against stored records, generates an OTP and sends it
     */
    private async sendSmsOtp(filters: SmsFiltersDto, phoneNumber: any) {
        const smsOtpEntity = await this.findSmsOtpEntity(filters);
        if (!smsOtpEntity.phone_number_hash) {
            throw new ProtocolException(SmsErrorCode.NO_PHONE_NUMBER, 'No phone number stored for citizen');
        }

        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        if (smsOtpEntity.phone_number_hash !== phoneNumberHash) {
            throw new ProtocolException(SmsErrorCode.PHONE_NUMBER_NO_MATCH, 'Phone number doesn\'t match for stored citizen');
        }

        const otp = await this.generateOtp(smsOtpEntity);
        await this.twillioService.sendOtp(phoneNumber, otp);
        return {
            status: 'sent',
            id: null,
        };
    }

    /**
     * Looks up the SMS OTP entity by passed in gov ids
     */
    private async findSmsOtpEntity(filters: SmsFiltersDto): Promise<SmsOtp> {
        let search;
        // Input verification has already been done so we can do an if else
        if (filters.govId1) {
            search = { gov_id_1_hash: SecurityUtility.hash32(filters.govId1 + process.env.HASH_PEPPER) };
        } else {
            search = { gov_id_2_hash: SecurityUtility.hash32(filters.govId2 + process.env.HASH_PEPPER) };
        }
        const results = await this.smsOtpRepository.find(search);
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
        const otp = this.twillioService.generateRandomOtp();
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
    private async verifyOtp(filters: SmsFiltersDto, otp: number) {
        const smsOtpEntity = await this.findSmsOtpEntity(filters);
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
            id: smsOtpEntity.agent_id,
        };
    }

    /**
     * Kicks off a timed job to expire the OTP in 15 min
     * To make this more robust we could add a cron job that double checks expiration times, or move stored OTPs to a cache
     */
    public scheduleOtpExpiration(smsOtpEntity: SmsOtp): void {
        setTimeout(
            async () => {
                smsOtpEntity.otp = null;
                smsOtpEntity.otp_expiration_time = null;
                await this.smsOtpRepository.save(smsOtpEntity);
            },
            parseInt(process.env.OTP_EXPIRE_MS, 10),
        );
    }

    /**
     * Saves a phone number for later SMS OTP verification
     */
    public async save(id: string, filters: SmsFiltersDto, params: SmsParamsDto) {
        const smsOtpEntity = new SmsOtp();
        smsOtpEntity.agent_id = id;
        smsOtpEntity.gov_id_1_hash = SecurityUtility.hash32(filters.govId1 + process.env.HASH_PEPPER);
        smsOtpEntity.gov_id_2_hash = SecurityUtility.hash32(filters.govId2 + process.env.HASH_PEPPER);
        smsOtpEntity.phone_number_hash = SecurityUtility.hash32(params.phoneNumber + process.env.HASH_PEPPER);
        try {
            await this.smsOtpRepository.save(smsOtpEntity);
        } catch (e) {
            // Maybe we want some extra handling?
            throw e;
        }
    }
}
