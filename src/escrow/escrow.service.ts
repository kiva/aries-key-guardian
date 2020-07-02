import { Injectable, InternalServerErrorException, HttpService } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletCredentials } from '../entity/wallet.credentials';
import { PluginFactory } from '../plugins/plugin.factory';
import cryptoRandomString from 'crypto-random-string';
import { ProtocolException } from '@kiva/protocol-common/protocol.exception';
import { ProtocolErrorCode } from '@kiva/protocol-common/protocol.errorcode';
import { ProtocolHttpService } from '@kiva/protocol-common/protocol.http.service';
import { Logger } from '@kiva/protocol-common/logger';

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
        // TODO we may want to update the verify result to include the connectionData even if null
        const result: any = await plugin.verify(filters, params);
        if (result.status === 'matched') {
            const walletCredentials = await this.fetchWalletCredentials(result.id);
            
            // TODO we need to save the admin api key and then we can pass it along here
            const data = await this.spinUpAgent(walletCredentials.wallet_id, walletCredentials.wallet_key, walletCredentials.wallet_key, walletCredentials.seed, walletCredentials.did);
            Logger.log(`Spun up agent for did ${walletCredentials.did}`, data);
            // Append the connection data onto the result
            result.connectionData = data.connectionData
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
        const data = await this.spinUpAgent(walletCredentials.wallet_id, walletCredentials.wallet_key, walletCredentials.wallet_key, walletCredentials.seed, walletCredentials.did);
        Logger.log(`Spun up agent for did ${walletCredentials.did}`);

        return { id: walletCredentials.did, connectionData: data.connectionData };
    }

    /**
     * TODO move this functionality to an agency facade
     * @tothink may want the whole wallet credentials object
     */
    private async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, seed: string, alias: string) {
        // TODO when this is in it's own class inject the http service
        const http = new ProtocolHttpService(new HttpService());
        const req: any = {
            method: 'POST',
            url: process.env.AGENCY_URL + '/v1/manager',
            data: {
                walletId,
                walletKey,
                adminApiKey,
                seed,
                alias
            }
        };
        const res = await http.requestWithRetry(req);
        return res.data;
    }

    private readonly chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

    /**
     * We want the random strings to include any letter or number
     */
    private async createRandomCredentials(): Promise<WalletCredentials> {
        // Wallet id's will be saved in postgres and need to be all lower case
        const walletId = cryptoRandomString({ length: 32, characters: this.chars }).toLowerCase();
        const walletKey = cryptoRandomString({ length: 32, characters: this.chars });
        const walletSeed = cryptoRandomString({ length: 32, characters: this.chars });
        const agentId = cryptoRandomString({ length: 22, characters: this.chars });
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
