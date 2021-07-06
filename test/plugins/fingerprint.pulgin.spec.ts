//import { Verify } from 'crypto';
//import { IPlugin } from '../../src/plugins/plugin.interface';
//import {ExternalIdDbGateway} from '../../src/db/external.id.db.gateway';
//import { FingerprintPlugin } from '../../src/plugins/impl/fingerprint.plugin';
//import { PluginTypeEnum } from '../../src/plugins/plugin.type.enum';
import { VerifyFiltersDto } from '../../src/plugins/dto/verify.filters.dto';
import { FingerprintPlugin } from '../../src/plugins/impl/fingerprint.plugin';
import { MockBioAuthService } from '../mock/mock.bio.auth.service';
import { ExternalId } from '../../src/db/entity/external.id';
import { MockRepository } from '../mock/mock.repository';
import { now, pepperHash } from '../support/functions';
import { VerifyFingerprintImageDto } from '../../src/plugins/dto/verify.fingerprint.image.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

export class MockFingerpintPlugin implements VerifyFiltersDto {

    constructor(private readonly status: string, private readonly id: string, private readonly agentId: string) {}

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

    async verifyFingerprint(params: any, position: number, image: string, agentId: string): Promise<any> {
        return Promise.resolve({
            data: {
                status: this.status,
                agentId: this.agentId,
            },
        });
    }
}
describe('Fingerprint Plugin is valid', () => {
    //const fingerprintVerifySpec = new VerifyFiltersDto ;
    it('Plugin is not empty', async () => {
        const agentId = 'agentId123';
        const bioAuthService = new MockBioAuthService('not_matched', agentId);

        const id2 = 1000000 + parseInt(now().toString().substr(7,6), 10);
        const id1 = 'N' + id2;
        const id1Hash = pepperHash(id1);
        const mockExternalId = new ExternalId();
        mockExternalId.agent_id = agentId;
        mockExternalId.external_id = id1Hash;
        mockExternalId.external_id_type = 'id_1';
        const mockExternalIdRepository: any = new MockRepository<ExternalId>([mockExternalId]);
        
        const fpPlugin = new FingerprintPlugin(bioAuthService, mockExternalIdRepository);

        const params = {
            position: 1,
            image: 'some image'
        } as VerifyFingerprintImageDto;
        const filters = {
            externalIds: {
                key: 'value'
            }
        } as VerifyFiltersDto;
        (await expect(fpPlugin.verify(params, filters))).rejects.toThrow(ProtocolException);

    });
    it('If fingerpirnt no match is thrown should throw a Protocol exception', async () => {

        const agentId = 'agentId123';
        const mockExternalId = new ExternalId();
         
        const bioAuthService = new class extends MockBioAuthService {
            async verifyFingerprint(position: number, image: string, agentIds: string): Promise<any> {
                throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NO_MATCH, 'msg');
            }
        }('matched', agentId);
        const mockExternalIdRespository: any = new MockRepository<ExternalId>([mockExternalId]);

        const fpPlugin = new FingerprintPlugin(bioAuthService, mockExternalIdRespository);

        const params = {
            position: 1,
            image: 'some image'
        } as VerifyFingerprintImageDto;
        const filters = {
            externalIds: {
                key: 'value'
            }
        } as VerifyFiltersDto;
        (await expect(fpPlugin.verify(params, filters))).rejects.toThrow(ProtocolException);
       

 
    });
 });
    

    







