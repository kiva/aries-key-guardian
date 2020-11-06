import { IJwksService } from '../../src/remote/jwks.service.interface';
import { CertSigningKey, SigningKey } from 'jwks-rsa';

export class MockJwksService implements IJwksService {

    constructor(private readonly publicKey: Buffer) {}

    private readonly certSigningKey: CertSigningKey = {
        kid: 'abcd',
        nbf: 'efgh',
        publicKey: this.publicKey.toString('base64'),
        getPublicKey(): string {
            return this.publicKey;
        }
    };

    async getKey(token: string): Promise<SigningKey> {
        return Promise.resolve(this.certSigningKey);
    }
}
