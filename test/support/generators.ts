import cryptoRandomString from 'crypto-random-string';

export const randomString = (length: number = 10) => {
    return cryptoRandomString({ length });
};