/**
 * This describes a sort of DSL for the Agency Service.
 */
export abstract class IAgencyService {
    abstract async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, seed: string, alias: string): Promise<any>;
}
