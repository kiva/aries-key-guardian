import { VerifyFiltersDto } from '../../src/plugins/dto/verify.filters.dto';
import { FingerprintPlugin } from '../../src/plugins/impl/fingerprint.plugin';
import { MockBioAuthService } from '../mock/mock.bio.auth.service';
import { ExternalId } from '../../src/db/entity/external.id';
import { MockRepository } from '../mock/mock.repository';
import { VerifyFingerprintImageDto } from '../../src/plugins/dto/verify.fingerprint.image.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

const params = {
    position: 1,
    image: 'some image'
} as VerifyFingerprintImageDto;
const filters = {
    externalIds: {
        key: 'value'
    }
} as VerifyFiltersDto;
const agentId = 'agentId123';
describe('Test to see if test status is other than "matched" will cause ProtocolException to throw', () => {
    it('If status is other than "matched" ProtocolException will be thrown ', async () => {
        const bioAuthService = new MockBioAuthService('not_matched', agentId);
        const mockExternalId = new ExternalId();
        mockExternalId.agent_id = agentId;
        mockExternalId.external_id = 'foobar';
        mockExternalId.external_id_type = 'id_1';
        const mockExternalIdRepository: any = new MockRepository<ExternalId>([mockExternalId]);
        const fpPlugin = new FingerprintPlugin(bioAuthService, mockExternalIdRepository);
        (await expect(fpPlugin.verify(params, filters))).rejects.toThrow(ProtocolException);
    });
    it('If fingerprint "FINGERPRINT_NO_MATCH" is thrown should throw a "ProtocolException"', async () => {
        const mockExternalId = new ExternalId();
        const bioAuthService = new class extends MockBioAuthService {
            async verifyFingerprint(position: number, image: string, agentIds: string): Promise<any> {
                throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NO_MATCH, 'msg');
            }
        }('matched', agentId);
        const mockExternalIdRespository: any = new MockRepository<ExternalId>([mockExternalId]);
        const fpPlugin = new FingerprintPlugin(bioAuthService, mockExternalIdRespository);
        (await expect(fpPlugin.verify(params, filters))).rejects.toThrow(ProtocolException);
    });
 });
    

    







