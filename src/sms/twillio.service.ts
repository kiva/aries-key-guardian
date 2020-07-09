import { Injectable } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { Constants } from 'protocol-common/constants';
import { SmsErrorCode } from './sms.errorcode';
import { default as twilio } from 'twilio';

/**
 * Putting Twillio in it's own service in case we want to support other SMS services
 */
@Injectable()
export class TwillioService {

    /**
     * send NIDP OTP SMS via Twilio
     * In our test envs (local + dev) we also log the OTP to make testing easier
     * toNumber: phone number to send the SMS to (owned by the authenticating user), e.g. +14151234567
     * otp: the number code that the authenticating user will use to prove their ownership of the phone number.
     *
     * Environment config:
     * TWILIO_ACCOUNT_SID: Kiva's twilio account identifier
     * TWILIO_AUTH_TOKEN: Kiva's twilio account auth token
     * TWILIO_PHONE_NUMBER: Kiva Protocol's phone number
     */
    public async sendOtp(toNumber: string, otp: number): Promise<void> {
        try {
            const message = `Your NIDP one-time passcode is ${otp}`;
            await this.sendSms(toNumber, message);
            if (process.env.NODE_ENV === Constants.LOCAL || process.env.NODE_ENV === Constants.DEV) {
                Logger.log('Test Twilio Message:', message);
            }
        } catch (e) {
            Logger.log('Error sending SMS', e);
            throw new ProtocolException(SmsErrorCode.SMS_SEND_FAILED, `SMS failed to send`);
        }
    }

    /**
     * send SMS message via Twilio
     * toNumber: phone number to send to
     * text: message to send
     */
    private async sendSms(toNumber: string, text: string): Promise<void> {
        // TODO(voutasaurus): check this config on startup and crash early if they're not set
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (accountSid === '' || authToken === '' || fromNumber === '') {
            throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR,
            `SMS configuration not found, required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER`);
        }

        const client = twilio(accountSid, authToken);
        const message = await client.messages.create({
          body: text,
          from: fromNumber,
          to: toNumber,
        });
        Logger.log('Twilio message sent', {'messageSID': message.sid});
    }

    /**
     * Putting the random OTP generation here to make mocking easier
     * Generate exactly 6 digits so can't start with 0
     */
    public generateRandomOtp(): number {
        return Math.floor(100000 + Math.random() * 900000);
    }
}
