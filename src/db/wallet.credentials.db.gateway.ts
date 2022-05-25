import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletCredentials } from './entity/wallet.credentials.js';
import { Repository } from 'typeorm';
import { LOWER_CASE_LETTERS, NUMBERS, ProtocolErrorCode, ProtocolException, randomString } from 'protocol-common';

@Injectable()
export class WalletCredentialsDbGateway {

    constructor(
        @InjectRepository(WalletCredentials)
        private readonly walletCredentialsRepository: Repository<WalletCredentials>
    ) {}

    /**
     * Retrieve the wallet credentials that correspond to the provided agentId.
     *
     * @throws ProtocolException with NOT_FOUND error code if there is currently no entry for the provided agentId
     */
    public async fetchWalletCredentials(agentId: string): Promise<WalletCredentials> {
        const walletCredentials: WalletCredentials = await this.walletCredentialsRepository.findOne({ agent_id: agentId });
        if (!walletCredentials) {
            throw new ProtocolException(ProtocolErrorCode.NOT_FOUND, `No wallet credentials found for "${agentId}"`);
        }
        return walletCredentials;
    }

    /**
     * Create wallet credentials with the provided agentId, but otherwise random values, and attempt to save it to the db. This may fail due to there
     * being a uniqueness constraint on the agentId at the db level.
     */
    public async createWalletCredentials(agentId: string): Promise<WalletCredentials> {

        // Wallet id should be lower case when using DB per wallet mode, since we use multiwallet mode it matters less
        const walletId = randomString(32, LOWER_CASE_LETTERS + NUMBERS);
        const walletKey = randomString(32);
        const walletSeed = randomString(32);
        const walletCredentials = new WalletCredentials();
        walletCredentials.agent_id = agentId;
        walletCredentials.wallet_id = walletId;
        walletCredentials.wallet_key = walletKey;
        walletCredentials.seed = walletSeed;

        try {
            await this.walletCredentialsRepository.save(walletCredentials);
            Logger.log(`Saved wallet credentials for agentId ${walletCredentials.agent_id}`);
            return walletCredentials;
        } catch (e) {
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Wallet credentials already exist for agentId ${agentId}`);
        }
    }

    /**
     * Check if any wallet credentials exist for the given agentId.
     */
    public async walletCredentialsExist(agentId: string): Promise<boolean> {
        return (await this.walletCredentialsRepository.count({agent_id: agentId})) > 0;
    }
}
