import { Injectable } from '@nestjs/common';
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
import { WalletCredentialsDbGateway } from '../db/wallet.credentials.db.gateway';

/**
 * The escrow system determines which plugin to use and calls the appropriate function
 */
@Injectable()
export class EscrowService {

    private static readonly letters = 'abcdefghijklmnopqrstuvwxyz';

    constructor(
        private readonly agencyService: IAgencyService,
        private readonly externalIdDbGateway: ExternalIdDbGateway,
        private readonly walletCredentialsDbGateway: WalletCredentialsDbGateway,
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
            const did = result.id.toLowerCase();
            const walletCredentials = await this.walletCredentialsDbGateway.fetchWalletCredentials(did);

            const response = await this.agencyService.registerMultitenantAgent(
                walletCredentials.wallet_id,
                walletCredentials.wallet_key,
                did,
            );
            Logger.log(`Register agent for did ${walletCredentials.did}`);
            // Append the connection data onto the result
            result.connectionData = response.data.invitation;
        }
        return result;
    }

    /**
     * Handles create a new agent and saving the verification data to allow later authentication
     */
    public async create(pluginType: string, filters: CreateFiltersDto, params: any): Promise<{ id: string, connectionData: any }> {

        // In case this is a retry (roll-forward case), try to retrieve existing ExternalIds. If any are found, they should all map to the same DID,
        // indicating that it is from a previous attempt at onboarding. Otherwise, treat this is as the first attempt.
        const externalIds: Array<ExternalId> = await this.externalIdDbGateway.fetchExternalIds(CreateFiltersDto.getIds(filters), false);
        let did: string;
        if (externalIds.length > 0 && externalIds.every((externalId: ExternalId) => externalId.did === externalIds[0].did)) {
            did = externalIds[0].did.toLowerCase();
        } else {
            did = cryptoRandomString({ length: 22, characters: EscrowService.letters });
            await this.externalIdDbGateway.createExternalIds(did, filters);
        }

        const plugin = this.pluginFactory.create(pluginType);

        try {
            await plugin.save(did, params);
            Logger.log(`Saved to plugin ${pluginType}`);
        } catch (e) {
            throw new ProtocolException('PluginError', `Failed to save to plugin of type ${pluginType}: ${e.message}`);
        }

        const walletCredentials: WalletCredentials = await this.walletCredentialsDbGateway.createWalletCredentials(did);

        const response = await this.agencyService.registerMultitenantAgent(
            walletCredentials.wallet_id,
            walletCredentials.wallet_key,
            did,
        );
        Logger.log(`Register agent for did ${walletCredentials.did}`);

        return { id: walletCredentials.did, connectionData: response.data.invitation };
    }

    /**
     * Assuming there are already wallet credentials this adds support for the new plugin
     * TODO we may want error handling if the plugin row already exists and we attempt to save again
     */
    public async add(pluginType: string, did: string, filters: CreateFiltersDto, params: any): Promise<{ result: string }> {
        const sanitizedDid = did.toLowerCase();
        const walletCredentialsExist = await this.walletCredentialsDbGateway.walletCredentialsExist(sanitizedDid);
        if (!walletCredentialsExist) {
            throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Can\'t update escrow service, the id doesn\'t exist');
        }

        await this.externalIdDbGateway.getOrCreateExternalIds(sanitizedDid, filters);

        const plugin = this.pluginFactory.create(pluginType);
        try {
            await plugin.save(sanitizedDid, params);
            Logger.log(`Saved to plugin ${pluginType}`);
        } catch (e) {
            throw new ProtocolException('PluginError', `Failed to save to plugin of type ${pluginType}: ${e.message}`);
        }
        return { result: 'success' };
    }
}
