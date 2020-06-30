import { Injectable, HttpService, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import cryptoRandomString from 'crypto-random-string';
import { AES } from 'crypto-js';
import { Trace } from '@kiva/protocol-common/trace.decorator';
import { ProtocolHttpService } from '@kiva/protocol-common/protocol.http.service';
import { JwtPayload } from './jwt-payload.interface';
import { JwtToken } from './jwtToken.interface';
import { WalletCredentials } from '../entity/wallet.credentials';
import { PluginFactory } from '../plugins/plugin.factory';
import { PluginTypeEnum } from '../plugins/plugin.type.enum';


/**
 * For validation and assignment of JWT tokens, used to authenticate user identity across all restricted API endpoints
 */
@Injectable()
export class AuthService {

    private readonly http: ProtocolHttpService;

    /**
     * Inject dependencies
     */
    constructor(
        private readonly jwtService: JwtService,
        httpService: HttpService,
        @InjectRepository(WalletCredentials)
        private readonly walletCredentialsRepository: Repository<WalletCredentials>,
        private readonly pluginFactory: PluginFactory,
    ) {
        this.http = new ProtocolHttpService(httpService);
    }

    /**
     * Returns information about citizen wallet in encrypted format
     */
    @Trace
    public async getWalletDetailsFromDid(did: string): Promise<string> {
        const walletCredentials = await this.getWalletFromRepo(did);
        const blob = {
            id: walletCredentials.wallet_id,
            key: walletCredentials.wallet_key,
            did,
            seed: walletCredentials.seed,
        };
        return this.encryptBlob(blob);
    }

    /**
     * Passes args onto the identity-service, if there's a match it will return the did and we can look up the data for the token
     */
    @Trace
    public async generateTokenFromFingerprint(position: number, filters: any, image: string): Promise<JwtToken> {
        const data = await this.getDataForFingerprint(position, filters, image);
        return await this.findAndGenerateToken(data.id);
    }

    /**
     * Handling the sending of SMSs and verifying the OTPs
     */
    @Trace
    public async handleSmsOtpAuth(filters: any, phoneNumber: any, otp: any): Promise<any> {
        const plugin = this.pluginFactory.create(PluginTypeEnum.SMS_OTP);
        const mappedFilters = {
            govId1: filters.nationalId,
            govId2: filters.voterId
        }
        if (phoneNumber) {
            return await plugin.verify(mappedFilters, { phoneNumber });
        } else {
            const data = await plugin.verify(mappedFilters, { otp });
            return await this.findAndGenerateToken(data.id);
        }
    }

    /**
     * Finds wallet credentials based on did and creates a token from them
     */
    @Trace
    public async findAndGenerateToken(did: string): Promise<JwtToken> {
        const walletCredentials = await this.getWalletFromRepo(did);
        return await this.generateToken(walletCredentials.wallet_id, walletCredentials.wallet_key, did);
    }

    /**
     * Passes args to the identity service and handles error conditions
     *
     * TODO analyze the performance between the auth server and identity service, there could be some improvements by going over
     * TCP or gRPC rather than HTTP
     */
    @Trace
    public async getDataForFingerprint(position: number, filters: any, image: string) {
        const plugin = this.pluginFactory.create(PluginTypeEnum.FINGERPRINT);
        return await plugin.verify(filters, { position, image });
    }

    /**
     * Saves wallet credentials and generates a token
     */
    public async saveWalletCredentials(did: string, walletId: string, walletKey: string, seed: string): Promise<JwtToken> {
        const credentials: WalletCredentials = await this.saveCredentials(did, walletId, walletKey, seed);
        return await this.generateToken(credentials.wallet_id, credentials.wallet_key, did);
    }

    /**
     * Saves wallet credentials
     * TODO may need to think about whether we should allow updates here
     */
    public async saveCredentials(did: string, walletId: string, walletKey: string, seed: string): Promise<WalletCredentials> {
        const walletCredentials = new WalletCredentials();
        walletCredentials.did = did;
        walletCredentials.wallet_id = walletId;
        walletCredentials.wallet_key = walletKey;
        walletCredentials.seed = seed;
        return await this.walletCredentialsRepository.save(walletCredentials);
    }

    public async deleteWalletCredentials(did: string) {
        await this.walletCredentialsRepository.delete({did});
    }

    /**
     * First we encrypt the payload, then sign the JWT
     * Note: using AES symmetric encryption for now, we may want to use asymmetric encryption
     *       or figure out how to avoid passing the wallet id and key in JWTs to begin with
     * To use the returned token, pass it to identity service in the `x-jwt-auth` header
     */
    public async generateToken(id: string, key: string, did?: string): Promise<JwtToken> {
        const nonce = AuthService.createNonce();
        const payload: JwtPayload = { id, key, nonce };
        const encrypted = this.encryptBlob(payload);
        const accessToken = this.jwtService.sign({ payload: encrypted });
        // NOTE: return type is JwtToken which contains fields for did and see as well
        // this is not the same as JwtPayload
        return {
            expiresIn: parseInt(process.env.JWT_EXPIRE_SECONDS, 10),
            accessToken,
            did,
        };
    }

    /**
     * Ensures a provided JWT token correlates to an existing wallet
     */
    public async validateToken(payload: JwtPayload): Promise<object> {
        return {};
    }

    /**
     * Creates a random 10-digit nonce
     * Generate a cryptographically-strong set of data string consisting only of numerical digits (0-9)
     * NOTE: There may be more we need to do for nonces, eg do we need to check to make sure they're not used more than once?
     */
    public static createNonce(): string {
        return cryptoRandomString({length: 10, characters: '1234567890'});
    }

    /**
     * Depending on how the PEM key is read for the env file, it might not process the new lines and quotes correctly
     * This ensures that no matter the environment the key comes formatted correctly
     */
    public static parsePemKey(key: string): string {
        return key.replace(/\\n/g, '\n').replace(/\"/g, '');
    }

    /**
     * Checks is the did exists in the auth db
     */
    public async didExists(did: string): Promise<boolean> {
        const count = await this.walletCredentialsRepository.count({did});
        return (count >= 1);
    }

    public static getConfig(): any {
        return {
            privateKey: AuthService.parsePemKey(process.env.JWT_PRIVATE_SIGNING_KEY),
            publicKey: AuthService.parsePemKey(process.env.JWT_PUBLIC_SIGNING_KEY),
            signOptions: {
                algorithm: 'ES256',
                expiresIn: parseInt(process.env.JWT_EXPIRE_SECONDS, 10),
                issuer: 'kiva',
            },
        }
    }

    /**
     * Gets wallet credentials by did and throws an exception is not found
     */
    private async getWalletFromRepo(did: string): Promise<WalletCredentials> {
        const walletCredentials: WalletCredentials = await this.walletCredentialsRepository.findOne({did});
        if (!walletCredentials) {
            throw new InternalServerErrorException(`No wallet credentials found for DID "${did}"`);
        }

        return walletCredentials;
    }

    /**
     * Encrypts data
     */
    private encryptBlob(blob: any): string {
        return AES.encrypt(JSON.stringify(blob), process.env.JWT_ENCRYPTION_KEY).toString();
    }
}
