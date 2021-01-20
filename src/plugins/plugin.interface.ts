/**
 * Defines the interface for all our authentication plugins
 */
export interface IPlugin {

    /**
     * @param filters - An object of filters used to uniquely identify an entity (e.g. { govId1: NIN11111 } )
     * @param params  - An object of params used to authenticate an entity (e.g. { image: fingerprint })
     */
    verify(filters: any, params: any): Promise<{ status: string, id: string }>;

    /**
     * @param id - The id used to track this entities agent (sometimes agent id or agent did)
     * @param params - An object of params used to authenticate an entity (e.g. { otp: 123456 })
     */
    save(id: string, params: any): Promise<void>;
}
