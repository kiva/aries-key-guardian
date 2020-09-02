import { SecurityUtility } from 'protocol-common/security.utility';

export const pepperHash = (input: string) => {
    return SecurityUtility.hash32(`${input}${process.env.HASH_PEPPER}`);
};