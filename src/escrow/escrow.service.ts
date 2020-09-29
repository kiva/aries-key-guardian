import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { Logger } from 'protocol-common/logger';
import cryptoRandomString from 'crypto-random-string';
import { WalletCredentials } from '../entity/wallet.credentials';
import { PluginFactory } from '../plugins/plugin.factory';
import { IAgencyService } from '../remote/agency.service.interface';

/**
 * The escrow system determines which plugin to use and calls the appropriate function
 */
@Injectable()
export class EscrowService {

    constructor(
        @InjectRepository(WalletCredentials)
        private readonly walletCredentialsRepository: Repository<WalletCredentials>,
        private readonly agencyService: IAgencyService,
        public readonly pluginFactory: PluginFactory
    ) { }

    /**
     * Creates the appropriate plugin and calls verify, if there's a match it calls the agency to spin up an agent and returns connection data
     */
    public async verify(pluginType: string, filters: any, params: any) {
        const plugin = this.pluginFactory.create(pluginType);
        // TODO we may want to update the verify result to include the connectionData even if null
        const result: any = await plugin.verify(filters, params);
        if (result.status === 'matched') {
            const walletCredentials = await this.fetchWalletCredentials(result.id);

            // TODO we need to save the admin api key and then we can pass it along here
            const response = await this.agencyService.spinUpAgent(
                walletCredentials.wallet_id,
                walletCredentials.wallet_key,
                walletCredentials.wallet_key,
                walletCredentials.seed,
                walletCredentials.did,
            );
            Logger.log(`Spun up agent for did ${walletCredentials.did}`, response.data);
            // Append the connection data onto the result
            result.connectionData = response.data.connectionData;
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
    public async create(pluginType: string, filters: any, params: any): Promise<{ id: string, connectionData: any }> {
        const walletCredentials = await this.createRandomCredentials();

        const plugin = this.pluginFactory.create(pluginType);
        await plugin.save(walletCredentials.did, filters, params);
        Logger.log(`Saved to plugin ${pluginType}`);

        await this.walletCredentialsRepository.save(walletCredentials);
        Logger.log(`Saved wallet credentials for did ${walletCredentials.did}`);

        // TODO we need to save the admin api key and then we can pass it along here
        const response = await this.agencyService.spinUpAgent(
            walletCredentials.wallet_id,
            walletCredentials.wallet_key,
            walletCredentials.wallet_key,
            walletCredentials.seed,
            walletCredentials.did
        );
        Logger.log(`Spun up agent for did ${walletCredentials.did}`);

        return { id: walletCredentials.did, connectionData: response.data.connectionData };
    }

    private readonly chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

    /**
     * We want the random strings to include any letter or number
     */
    private async createRandomCredentials(): Promise<WalletCredentials> {
        // Wallet id should be lower case when using DB per wallet mode, since we use multiwallet mode it matters less
        const walletId = cryptoRandomString({ length: 32, characters: this.chars }).toLowerCase();
        const walletKey = cryptoRandomString({ length: 32, characters: this.chars });
        const walletSeed = cryptoRandomString({ length: 32, characters: this.chars });
        // Agent id needs to be lowercase for k8s pod rules
        const agentId = `agent-${cryptoRandomString({ length: 22, characters: this.chars }).toLowerCase()}`;
        const agentApiKey = cryptoRandomString({ length: 32, characters: this.chars }); // TODO update DB to save apiKeys
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
