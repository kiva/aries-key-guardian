import { Injectable } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { Logger } from 'protocol-common/logger';
import { WalletCredentials } from '../db/entity/wallet.credentials';
import { PluginFactory } from '../plugins/plugin.factory';
import { IAgencyService } from '../remote/agency.service.interface';
import { VerifyFiltersDto } from '../plugins/dto/verify.filters.dto';
import { CreateFiltersDto } from './dto/create.filters.dto';
import { ExternalIdDbGateway } from '../db/external.id.db.gateway';
import { ExternalId } from '../db/entity/external.id';
import { WalletCredentialsDbGateway } from '../db/wallet.credentials.db.gateway';
import { LOWER_CASE_LETTERS, randomString } from '../support/random.string.generator';
import { IExternalControllerService } from '../remote/external.controller.service.interface';
import { OnboardResponseDto } from '../remote/dto/onboard.response.dto';
import { VerifyResultDto } from '../plugins/dto/verify.result.dto';

/**
 * The escrow system determines which plugin to use and calls the appropriate function
 */
@Injectable()
export class EscrowService {

    constructor(
        private readonly agencyService: IAgencyService,
        private readonly externalIdDbGateway: ExternalIdDbGateway,
        private readonly walletCredentialsDbGateway: WalletCredentialsDbGateway,
        private readonly pluginFactory: PluginFactory,
        private readonly externalController: IExternalControllerService
    ) { }

    /**
     * Creates the appropriate plugin and calls verify, if there's a match it calls the agency to spin up an agent and returns connection data
     */
    public async verify(pluginType: string, params: any, filters: VerifyFiltersDto): Promise<VerifyResultDto> {
        const justInTimeWalletsEnabled: boolean = process.env.JIT_WALLETS_ENABLED === 'true';
        const plugin = this.pluginFactory.create(pluginType);

        const filterIds = VerifyFiltersDto.getIds(filters);
        let agentIds: string[] = (await this.externalIdDbGateway.fetchExternalIds(filterIds, !justInTimeWalletsEnabled))
            .map((externalId: ExternalId) => externalId.agent_id);

        // If there are no agentIds, then there is no wallet. If the Just-In-Time Wallet flow is enabled for this deployment, create the wallet now.
        if ((agentIds.length === 0))  {
            if (filterIds.size > 1) {
                throw new ProtocolException(ProtocolErrorCode.INVALID_FILTERS, 'May only create a wallet for a single ID');
            }
            const externalIdValue: string = Array.from(filterIds.values())[0];
            const onboardResult: OnboardResponseDto = await this.externalController.callExternalWalletCreate(externalIdValue);
            if (!onboardResult.success) {
                throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, 'Failed to onboard citizen. The wallet may already exist.');
            }
            agentIds = [onboardResult.agentId];
        }

        // TODO we may want to update the verify result to include the connectionData even if null
        const verifyResult: VerifyResultDto = await plugin.verify(agentIds, params, filters);
        if (verifyResult.status === 'matched') {
            let agentId: string = verifyResult.id;
            if (verifyResult.idType) { // indicates this is not an agentId, but rather an externalId
                agentId = (await this.externalIdDbGateway.fetchExternalId(verifyResult.idType, verifyResult.id)).agent_id;
            }
            const walletCredentials = await this.walletCredentialsDbGateway.fetchWalletCredentials(agentId);

            const response = await this.agencyService.registerMultitenantAgent(
                walletCredentials.wallet_id,
                walletCredentials.wallet_key,
                agentId,
            );
            Logger.log(`Register agent for agentId ${walletCredentials.agent_id}`);
            // Append the connection data onto the result
            verifyResult.connectionData = response.data.invitation;
        }
        return verifyResult;
    }

    /**
     * Handles create a new agent and saving the verification data to allow later authentication
     */
    public async create(pluginType: string, filters: CreateFiltersDto, params: any): Promise<{ id: string, connectionData: any }> {

        // In case this is a retry (roll-forward case), try to retrieve existing ExternalIds. If any are found, they should all map to the same Agent
        // ID, indicating that it is from a previous attempt at onboarding. Otherwise, treat this is as the first attempt.
        const externalIds: Array<ExternalId> = await this.externalIdDbGateway.fetchExternalIds(CreateFiltersDto.getIds(filters), false);
        let agentId: string;
        if (externalIds.length > 0 && externalIds.every((externalId: ExternalId) => externalId.agent_id === externalIds[0].agent_id)) {
            agentId = externalIds[0].agent_id;
        } else {
            agentId = randomString(22, LOWER_CASE_LETTERS);
            await this.externalIdDbGateway.createExternalIds(agentId, filters);
        }

        const plugin = this.pluginFactory.create(pluginType);

        try {
            await plugin.save(agentId, params);
            Logger.log(`Saved to plugin ${pluginType}`);
        } catch (e) {
            if (e.code && e.code === ProtocolErrorCode.VALIDATION_EXCEPTION) {
                throw e;
            } else {
                throw new ProtocolException(ProtocolErrorCode.PLUGIN_ERROR, `Failed to save to plugin of type ${pluginType}: ${e.message}`);
            }
        }

        let walletCredentials: WalletCredentials;
        if (await this.walletCredentialsDbGateway.walletCredentialsExist(agentId)) {
            walletCredentials = await this.walletCredentialsDbGateway.fetchWalletCredentials(agentId);
        } else {
            walletCredentials = await this.walletCredentialsDbGateway.createWalletCredentials(agentId);
        }

        const response = await this.agencyService.registerMultitenantAgent(
            walletCredentials.wallet_id,
            walletCredentials.wallet_key,
            agentId,
        );
        Logger.log(`Register agent for agentId ${walletCredentials.agent_id}`);

        return { id: walletCredentials.agent_id, connectionData: response.data.invitation };
    }

    /**
     * Assuming there are already wallet credentials this adds support for the new plugin
     * TODO we may want error handling if the plugin row already exists and we attempt to save again
     */
    public async add(pluginType: string, agentId: string, filters: CreateFiltersDto, params: any): Promise<{ result: string }> {
        const sanitizedAgentId = agentId;
        const walletCredentialsExist = await this.walletCredentialsDbGateway.walletCredentialsExist(sanitizedAgentId);
        if (!walletCredentialsExist) {
            throw new ProtocolException(ProtocolErrorCode.VALIDATION_EXCEPTION, 'Can\'t update escrow service, the id doesn\'t exist');
        }

        await this.externalIdDbGateway.getOrCreateExternalIds(sanitizedAgentId, filters);

        const plugin = this.pluginFactory.create(pluginType);
        try {
            await plugin.save(sanitizedAgentId, params);
            Logger.log(`Saved to plugin ${pluginType}`);
        } catch (e) {
            if (e.code && e.code === ProtocolErrorCode.VALIDATION_EXCEPTION) {
                throw e;
            } else {
                throw new ProtocolException(ProtocolErrorCode.PLUGIN_ERROR, `Failed to save to plugin of type ${pluginType}: ${e.message}`);
            }
        }
        return { result: 'success' };
    }
}
