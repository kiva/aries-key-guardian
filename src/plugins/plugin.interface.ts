/**
 * Defines the interface for all our authentication plugins
 */
import { VerifyFiltersDto } from './dto/verify.filters.dto';
import { ExternalId } from '../db/entity/external.id';

export interface IPlugin {

    /**
     * @param externalIds - A list of objects that map an external ID to an agent ID
     * @param params      - An object of params used to authenticate an entity (e.g. { image: fingerprint })
     * @param filters     - An object of filters used to uniquely identify an entity (e.g. { govId1: NIN11111 } )
     */
    verify(externalIds: ExternalId[], params: any, filters: VerifyFiltersDto): Promise<{ status: string, id: string }>;

    /**
     * @param id - The id used to track this entities agent (sometimes agent id or agent did)
     * @param params - An object of params used to authenticate an entity (e.g. { otp: 123456 })
     */
    save(id: string, params: any): Promise<void>;
}
