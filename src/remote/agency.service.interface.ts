/**
 * This describes a sort of DSL for the Agency Service.
 */
export abstract class IAgencyService {
    abstract spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, seed: string, agentId: string): Promise<any>;
    abstract registerMultitenantAgent(walletName: string, walletKey: string, label: string): Promise<any>;
}
