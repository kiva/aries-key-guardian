import { IJwksService } from '../../src/remote/jwks.service.interface';
import { CertSigningKey, SigningKey } from 'jwks-rsa';

export class MockJwksService implements IJwksService {

    constructor(private readonly publicKey: string) {}

    private readonly certSigningKey: CertSigningKey = {
        kid: 'abcd',
        alg: 'RS256',
        publicKey: this.publicKey,
        getPublicKey(): string {
            return this.publicKey;
        }
    };

    async getKey(): Promise<SigningKey> {
        return Promise.resolve(this.certSigningKey);
    }
}
