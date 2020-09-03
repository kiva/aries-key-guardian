import { SecurityUtility } from 'protocol-common/security.utility';

export const pepperHash = (input: string) => {
    return SecurityUtility.hash32(`${input}${process.env.HASH_PEPPER}`);
};

export const now = (): Date => {
    return new Date(Date.now());
};

export const nDaysFromNow = (n: number): Date => {
    return new Date(Date.now() + (1000 * 60 * 60 * 24 * n));
};