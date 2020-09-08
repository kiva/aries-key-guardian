/**
 * @tothink if these become more general we can move to common
 */

export enum SmsErrorCode {
    NO_PHONE_NUMBER = 'NoPhoneNumber',
    PHONE_NUMBER_NO_MATCH = 'PhoneNumberNoMatch',
    SMS_SEND_FAILED = 'SmsSendFailed',
    OTP_NO_MATCH = 'OtpNoMatch',
    OTP_EXPIRED = 'OtpExpired',
    TOO_MANY_ATTEMPTS = 'TooManyAttempts',
}
