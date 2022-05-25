import { InjectRepository } from '@nestjs/typeorm';
import { SmsOtp } from './entity/sms.otp.js';
import typeorm from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ProtocolErrorCode, ProtocolException, SecurityUtility } from 'protocol-common';

@Injectable()
export class SmsOtpDbGateway {

    constructor(
        @InjectRepository(SmsOtp)
        private readonly smsOtpRepository: typeorm.Repository<SmsOtp>
    ) {}

    /**
     * Given a agentId, return the entry corresponding to that agentId, if one exists. If one does not exist, throw a ProtocolException.
     */
    public async fetchSmsOtp(agentId: string): Promise<SmsOtp> {
        const smsOtp: SmsOtp | undefined = await this.smsOtpRepository.findOne({agent_id: agentId});
        if (!smsOtp) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No citizen found for given filters');
        }
        return smsOtp;
    }

    /**
     * Given a agentId, update the entry corresponding to that agentId to use the provided phone number. If no such entry exists, create one and add
     * the provided phone number to that entry.
     */
    public async savePhoneNumber(agentId: string, phoneNumber: string): Promise<SmsOtp> {
        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        return this.smsOtpRepository.manager.transaction(async (entityManager: typeorm.EntityManager) => {
            let smsOtp: SmsOtp | undefined = await entityManager.findOne(SmsOtp, {agent_id: agentId});
            if (!smsOtp) {
                smsOtp = new SmsOtp();
                smsOtp.agent_id = agentId;
            }
            return entityManager.save(SmsOtp, {
                ...smsOtp,
                phone_number_hash: phoneNumberHash
            });
        });
    }

    /**
     * Save an OTP to the record corresponding to the provided agentId. If there is no such record, throw a ProtocolException error.
     */
    public saveOtp(agentId: string, phoneNumber: string, otp: number): Promise<SmsOtp> {
        const phoneNumberHash = SecurityUtility.hash32(phoneNumber + process.env.HASH_PEPPER);
        const otpExpirationTime = new Date(Date.now() + 900000); // 15 min (15 min * 60 sec * 1000 ms)
        return this.smsOtpRepository.manager.transaction(async (entityManager: typeorm.EntityManager) => {
            const smsOtp: SmsOtp | undefined = await entityManager.findOne(SmsOtp, {
                agent_id: agentId,
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
