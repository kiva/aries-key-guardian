import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletCredentials } from './entity/wallet.credentials';
import { Repository } from 'typeorm';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { LOWER_CASE_LETTERS, NUMBERS, randomString } from '../support/random.string.generator';

@Injectable()
export class WalletCredentialsDbGateway {

    constructor(
        @InjectRepository(WalletCredentials)
        private readonly walletCredentialsRepository: Repository<WalletCredentials>
    ) {}

    /**
     * Retrieve the wallet credentials that correspond to the provided did.
     *
     * @throws ProtocolException with NOT_FOUND error code if there is currently no entry for the provided did
     */
    public async fetchWalletCredentials(did: string): Promise<WalletCredentials> {
        const walletCredentials: WalletCredentials = await this.walletCredentialsRepository.findOne({ did });
        if (!walletCredentials) {
            throw new ProtocolException(ProtocolErrorCode.NOT_FOUND, `No wallet credentials found for "${did}"`);
        }
        return walletCredentials;
    }

    /**
     * Create wallet credentials with the provided did, but otherwise random values, and attempt to save it to the db. This may fail due to there
     * being a uniqueness constraint on the did at the db level.
     */
    public async createWalletCredentials(did: string): Promise<WalletCredentials> {

        // Wallet id should be lower case when using DB per wallet mode, since we use multiwallet mode it matters less
        const walletId = randomString(32, LOWER_CASE_LETTERS + NUMBERS);
        const walletKey = randomString(32);
        const walletSeed = randomString(32);
        const walletCredentials = new WalletCredentials();
        walletCredentials.did = did;
        walletCredentials.wallet_id = walletId;
        walletCredentials.wallet_key = walletKey;
        walletCredentials.seed = walletSeed;

        try {
            await this.walletCredentialsRepository.save(walletCredentials);
            Logger.log(`Saved wallet credentials for did ${walletCredentials.did}`);
            return walletCredentials;
        } catch (e) {
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Wallet credentials already exist for did ${did}`);
        }
    }

    /**
     * Check if any wallet credentials exist for the given did.
     */
    public async walletCredentialsExist(did: string): Promise<boolean> {
        return (await this.walletCredentialsRepository.count({did})) > 0;
    }
}
