import { CertSigningKey, SigningKey } from 'jwks-rsa';

export abstract class IJwksService {
    abstract getKey(token: string): Promise<SigningKey>;

    public static isCertSigningKey(key: SigningKey): key is CertSigningKey {
        return (key as CertSigningKey).publicKey !== undefined;
    }
}
