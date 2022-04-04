/**
 * Defines the interface for all our authentication plugins
 */
import { VerifyFiltersDto } from './dto/verify.filters.dto';
import { VerifyResultDto } from './dto/verify.result.dto';

export interface IPlugin {

    /**
     * @param agentIds - A list of agent IDs that correspond to the provided filters
     * @param params   - An object of params used to authenticate an entity (e.g. { image: fingerprint })
     * @param filters  - An object of filters used to uniquely identify an entity (e.g. { govId1: NIN11111 } )
     */
    verify(agentIds: string[], params: any, filters: VerifyFiltersDto): Promise<VerifyResultDto>;

    /**
     * @param id - The id used to track this entities agent (sometimes agent id or agent did)
     * @param params - An object of params used to authenticate an entity (e.g. { otp: 123456 })
     */
    save(id: string, params: any): Promise<void>;
}
