import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletCredentials } from '../entity/wallet.credentials';
import { PluginFactory } from '../plugins/plugin.factory';
import cryptoRandomString from 'crypto-random-string';
import { ProtocolException } from '@kiva/protocol-common/protocol.exception';
import { ProtocolErrorCode } from '@kiva/protocol-common/protocol.errorcode';

/**
 * The escrow system determines which plugin to use and calls the appropriate function
 */
@Injectable()
export class EscrowService {

    constructor(
        @InjectRepository(WalletCredentials)
        private readonly walletCredentialsRepository: Repository<WalletCredentials>,
        public readonly pluginFactory: PluginFactory
    ) { }

    /**
     * Creates the appropriate plugin and calls verify, if there's a match it calls the agency to spin up an agent and returns connection data
     */
    public async verify(pluginType: string, filters: any, params: any) {
        const plugin = this.pluginFactory.create(pluginType);
        const result = await plugin.verify(filters, params);
        if (result.status === 'matched') {
            const walletCredentials = await this.fetchWalletCredentials(result.id);
            // TODO call agency to spin up agent with the given wallet credentials
            // TODO we'll want to add some connection data to the result so the caller will know how to connect with the agent
        }
        return result;
    }

    /**
     * Gets wallet credentials by did and throws an exception is not found
     * TODO we're changing from "did" to "agentId", however this will involve DB changes, etc, so we can phase it in slowly
     */
    private async fetchWalletCredentials(agentId: string): Promise<WalletCredentials> {
        const walletCredentials: WalletCredentials = await this.walletCredentialsRepository.findOne({ did: agentId });
        if (!walletCredentials) {
            throw new InternalServerErrorException(`No wallet credentials found for "${agentId}"`);
        }
        return walletCredentials;
    }

    /**
     * Handles create a new agent and saving the verification data to allow later authentication
     */
    public async create(pluginType: string, filters: any, params: any): Promise<{ id: string }> {
        const walletCredentials = await this.createRandomCredentials();

        const plugin = this.pluginFactory.create(pluginType);
        await plugin.save(walletCredentials.did, filters, params);

        await this.walletCredentialsRepository.save(walletCredentials);
        // Call agency to spin up agent
        // Return connection info to agent, for now just return the agentId
        return { id: walletCredentials.did };
    }

    /**
     * Note we used to use 'base64' but 'url-safe' is cleaner because it excludes symbols
     */
    private async createRandomCredentials(): Promise<WalletCredentials> {
        // Wallet id's will be saved in postgres and need to be all lower case
        const walletId = cryptoRandomString({ length: 32, type: 'url-safe' }).toLowerCase();
        const walletKey = cryptoRandomString({ length: 32, type: 'url-safe' });
        const walletSeed = cryptoRandomString({ length: 32, type: 'url-safe' });
        const agentId = cryptoRandomString({ length: 22, type: 'url-safe' });
        const agentApiKey = cryptoRandomString({ length: 32, type: 'url-safe' }); // TODO update DB to save apiKeys
        const walletCredentials = new WalletCredentials();
        walletCredentials.did = agentId; // TODO change DB name to agent_id
        walletCredentials.wallet_id = walletId;
        walletCredentials.wallet_key = walletKey;
        walletCredentials.seed = walletSeed;
        return walletCredentials;
    }

    /**
     * Assuming there are already wallet credentials this adds support for the new plugin
     * TODO we may want error handling if the plugin row already exists and we attempt to save again
     */
    public async add(pluginType: string, id: string, filters: any, params: any): Promise<{ result: string }> {
        const count = await this.walletCredentialsRepository.count({ did: id });
        if (count < 1) {
            throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, `Can't update escrow service, the id doesn't exist`);
        }
        const plugin = this.pluginFactory.create(pluginType);
        await plugin.save(id, filters, params);
        return { result: 'success' };
    }
}
