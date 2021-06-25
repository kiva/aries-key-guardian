//import { Verify } from 'crypto';
//import { IPlugin } from '../../src/plugins/plugin.interface';
import { VerifyFiltersDto } from '../../src/plugins/dto/verify.filters.dto';
//import { FingerprintPlugin } from '../../src/plugins/impl/fingerprint.plugin';
import { PluginTypeEnum } from '../../src/plugins/plugin.type.enum';

export class MockFingerpintPlugin implements VerifyFiltersDto {

    constructor(private readonly status: string, private readonly id: string) {}
   
    externalIds: object;
    async getIds(filters: VerifyFiltersDto): Promise<Map<string, string>> {
        return new Map<string, string>(Object.entries(filters.externalIds));
    }

    async verify(params: any, filters: VerifyFiltersDto): Promise<{}> {
        return Promise.resolve({
            data: {
                status: this.status,
                did: this.id,
            },
        });
    }
}
describe('Fingerprint Plugin is valid', () => {

    //const fingerprintPluginSpec = new FingerprintPlugin(bioAuthService, externalIdDbGateway);
    
    it('Plugin is not empty', () => {
        const plugin = PluginTypeEnum.FINGERPRINT;
        expect(plugin).toBeDefined();
        expect(plugin.length).toBeGreaterThan(0);
    });


    it('Verify External ID is not empty', () => {
        const buckets = Object.keys(VerifyFiltersDto).map(bucket => {
            const idVerify = VerifyFiltersDto[bucket]
            expect(idVerify).toBeDefined();
            expect(idVerify.length).toBeGreaterThan(0);
        });
    expect(buckets.length).toBeGreaterThan(0);
    });
 });
    

    






/*export class FingerprintPluginSpec implements IPlugin {
   

    constructor(private readonly status: string, private readonly id: string) {}

    

    async verify(params: any, filters: VerifyFiltersDto): Promise<{ status: string, id: string }> {
        return Promise.resolve({
            status: this.status,
            id: this.id,
        });
    }
   
    

   
}*/
