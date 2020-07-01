/**
 * Defines the interface for all our authentication plugins
 */
export interface IPlugin {

    /**
     * @param filters - An object of filters used to identify an entity (eg { voterId: 123 })
     * @param params  - An object of params used to authenticate an entity (eg { image: fingerprint })
     */
    verify(filters: any, params: any): Promise<{ status: string, id: string }>;

    /**
     * @param id - The id used to track this entities agent (sometimes agent id or agent did)
     */
    save(id: string, filters: any, params: any): Promise<void>;
}
