import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { Logger } from 'protocol-common/logger';
import cryptoRandomString from 'crypto-random-string';
import { WalletCredentials } from '../db/entity/wallet.credentials';
import { PluginFactory } from '../plugins/plugin.factory';
import { IAgencyService } from '../remote/agency.service.interface';
import { VerifyFiltersDto } from '../plugins/dto/verify.filters.dto';
import { CreateFiltersDto } from './dto/create.filters.dto';
import { ExternalIdDbGateway } from '../db/external.id.db.gateway';
import { ExternalId } from '../db/entity/external.id';

/**
 * The escrow system determines which plugin to use and calls the appropriate function
 */
@Injectable()
export class EscrowService {

    constructor(
        @InjectRepository(WalletCredentials)
        private readonly walletCredentialsRepository: Repository<WalletCredentials>,
        private readonly agencyService: IAgencyService,
        private readonly externalIdDbGateway: ExternalIdDbGateway,
        private readonly pluginFactory: PluginFactory
    ) { }

    /**
     * Creates the appropriate plugin and calls verify, if there's a match it calls the agency to spin up an agent and returns connection data
     */
    public async verify(pluginType: string, filters: VerifyFiltersDto, params: any) {
        const plugin = this.pluginFactory.create(pluginType);

        // TODO we may want to update the verify result to include the connectionData even if null
        const result: any = await plugin.verify(filters, params);
        if (result.status === 'matched') {
            const walletCredentials = await this.fetchWalletCredentials(result.id);

            // TODO we need to save the admin api key and then we can pass it along here
            const adminApiKey = walletCredentials.wallet_key;
            const response = await this.agencyService.spinUpAgent(
                walletCredentials.wallet_id,
                walletCredentials.wallet_key,
                adminApiKey,
                walletCredentials.seed,
                result.id.toLocaleLowerCase(),
            );
            Logger.log(`Spun up agent for did ${walletCredentials.did}`, response.data);
            // Append the connection data onto the result
            result.connectionData = response.data.connectionData;
        }
        return result;
    }

    /**
     * Gets wallet credentials by did and throws an exception is not found
     */
    private async fetchWalletCredentials(did: string): Promise<WalletCredentials> {
        const walletCredentials: WalletCredentials = await this.walletCredentialsRepository.findOne({ did });
        if (!walletCredentials) {
            throw new InternalServerErrorException(`No wallet credentials found for "${did}"`);
        }
        return walletCredentials;
    }

    /**
     * Handles create a new agent and saving the verification data to allow later authentication
     */
    public async create(pluginType: string, filters: CreateFiltersDto, params: any): Promise<{ id: string, connectionData: any }> {
        let walletCredentials: WalletCredentials;

        // In case this is a retry (roll-forward case), try to retrieve existing ExternalIds. If any are found, they should all map to the same DID,
        // indicating that it is from a previous attempt at onboarding. Otherwise, treat this is as fist attempt.
        const externalIds: Array<ExternalId> = await this.externalIdDbGateway.fetchExternalIds(CreateFiltersDto.getIds(filters), false);
        if (externalIds.length > 0 && externalIds.every((externalId: ExternalId) => externalId.did === externalIds[0].did)) {
            walletCredentials = await this.createRandomCredentials(externalIds[0].did);
        } else {
            walletCredentials = await this.createRandomCredentials();
            await this.externalIdDbGateway.createExternalIds(walletCredentials.did, filters);
        }

        const plugin = this.pluginFactory.create(pluginType);

        try {
            await plugin.save(walletCredentials.did, params);
            Logger.log(`Saved to plugin ${pluginType}`);
        } catch (e) {
            throw new ProtocolException('PluginError', `Failed to save to plugin of type ${pluginType}: ${e.message}`);
        }

        await this.walletCredentialsRepository.save(walletCredentials);
        Logger.log(`Saved wallet credentials for did ${walletCredentials.did}`);

        // TODO we need to save the admin api key and then we can pass it along here
        const adminApiKey = walletCredentials.wallet_key;
        const did = walletCredentials.did.toLowerCase();
        const response = await this.agencyService.spinUpAgent(
            walletCredentials.wallet_id,
            walletCredentials.wallet_key,
            adminApiKey,
            walletCredentials.seed,
            did,
        );

        Logger.log(`Spun up agent for did ${walletCredentials.did}`);

        return { id: walletCredentials.did, connectionData: response.data.connectionData };
    }

    private readonly chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    private readonly letters = 'abcdefghijklmnopqrstuvwxyz';

    /**
     * We want the random strings to include any letter or number.
     * TODO update DB to save agentApiKey (should be 32 alphanumeric characters)
     */
    private async createRandomCredentials(preexistingDid?: string): Promise<WalletCredentials> {
        // Wallet id should be lower case when using DB per wallet mode, since we use multiwallet mode it matters less
        const walletId = cryptoRandomString({ length: 32, characters: this.chars }).toLowerCase();
        const walletKey = cryptoRandomString({ length: 32, characters: this.chars });
        const walletSeed = cryptoRandomString({ length: 32, characters: this.chars });
        // Agent id needs to be lowercase letters for k8s pod rules
        const did = preexistingDid ?? cryptoRandomString({ length: 22, characters: this.letters });
        const walletCredentials = new WalletCredentials();
        walletCredentials.did = did;
        walletCredentials.wallet_id = walletId;
        walletCredentials.wallet_key = walletKey;
        walletCredentials.seed = walletSeed;
        return walletCredentials;
    }

    /**
     * Assuming there are already wallet credentials this adds support for the new plugin
     * TODO we may want error handling if the plugin row already exists and we attempt to save again
     */
    public async add(pluginType: string, id: string, filters: CreateFiltersDto, params: any): Promise<{ result: string }> {
        const count = await this.walletCredentialsRepository.count({ did: id });
        if (count < 1) {
            throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Can\'t update escrow service, the id doesn\'t exist');
        }

        await this.externalIdDbGateway.getOrCreateExternalIds(id, filters);

        const plugin = this.pluginFactory.create(pluginType);
        try {
            await plugin.save(id, params);
            Logger.log(`Saved to plugin ${pluginType}`);
        } catch (e) {
            throw new ProtocolException('PluginError', `Failed to save to plugin of type ${pluginType}: ${e.message}`);
        }
        return { result: 'success' };
    }
}
