import { InjectRepository } from '@nestjs/typeorm';
import { SmsOtp } from './entity/sms.otp';
import { EntityManager, Repository } from 'typeorm';
import { SecurityUtility } from 'protocol-common/security.utility';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsOtpDbGateway {

    constructor(
        @InjectRepository(SmsOtp)
        private readonly smsOtpRepository: Repository<SmsOtp>
    ) {}

    /**
     * Given a did, return the entry corresponding to that did, if one exists. If one does not exist, throw a ProtocolException.
     */
    public async fetchSmsOtp(did: string): Promise<SmsOtp> {
        const smsOtp: SmsOtp | undefined = await this.smsOtpRepository.findOne({did});
        if (!smsOtp) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No citizen found for given filters');
        }
        return smsOtp;
    }

    /**
     * Given a did, update the entry corresponding to that did to use the provided phone number. If no such entry exists, create one and add the
     * provided phone number to that entry.
     */
    public async savePhoneNumber(did: string, phoneNumber: string): Promise<SmsOtp> {
        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        return this.smsOtpRepository.manager.transaction(async (entityManager: EntityManager) => {
            let smsOtp: SmsOtp | undefined = await entityManager.findOne(SmsOtp, {did});
            if (!smsOtp) {
                smsOtp = new SmsOtp();
                smsOtp.did = did;
            }
            return entityManager.save(SmsOtp, {
                ...smsOtp,
                phone_number_hash: phoneNumberHash
            });
        });
    }

    /**
     * Save an OTP to the record corresponding to the provided did. If there is no such record, throw a ProtocolException error.
     */
    public saveOtp(did: string, phoneNumber: string, otp: number): Promise<SmsOtp> {
        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        const otpExpirationTime = new Date(Date.now() + 900000); // 15 min (15 min * 60 sec * 1000 ms)
        return this.smsOtpRepository.manager.transaction(async (entityManager: EntityManager) => {
            const smsOtp: SmsOtp | undefined = await entityManager.findOne(SmsOtp, {
                did,
                phone_number_hash: phoneNumberHash
            });
            if (!smsOtp) {
                throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No citizen found for given filters');
            }
            return entityManager.save(SmsOtp, {
                ...smsOtp,
                otp,
                otp_expiration_time: otpExpirationTime
            });
        });
    }

    /**
     * Given an SmsOtp record, expire the otp and save the record. Does not perform a lookup to check if the record currently exists.
     */
    public expireOtp(smsOtp: SmsOtp): Promise<SmsOtp> {
        const expiredSmsOtp: SmsOtp = {
            ...smsOtp,
            otp: null,
            otp_expiration_time: null
        };
        return this.smsOtpRepository.save(expiredSmsOtp);
    }
}
