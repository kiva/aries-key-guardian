import { VerifyFiltersDto } from '../../src/plugins/dto/verify.filters.dto';
import { FingerprintPlugin } from '../../src/plugins/impl/fingerprint.plugin';
import { MockBioAuthService } from '../mock/mock.bio.auth.service';
import { ExternalId } from '../../src/db/entity/external.id';
import { MockRepository } from '../mock/mock.repository';
import { VerifyFingerprintImageDto } from '../../src/plugins/dto/verify.fingerprint.image.dto';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { ExternalIdDbGateway } from '../../src/db/external.id.db.gateway';
import { VerifyFingerprintTemplateDto } from '../../dist/plugins/dto/verify.fingerprint.template.dto';
import { MockExternalControllerService } from '../mock/mock.external.controller.service';

describe('Fingerprint Plugin', () => {
    let verifyImageParams: VerifyFingerprintImageDto;
    let verifyTemplateParams: VerifyFingerprintTemplateDto;
    let verifyFilters: VerifyFiltersDto;
    let agentId: string;
    let externalIdDbGateway: ExternalIdDbGateway;

    beforeAll(() => {
        verifyImageParams = {
            position: 1,
            image: 'some image'
        };
        verifyTemplateParams = {
            position: 1,
            template: 'some template'
        };
        verifyFilters = {
            externalIds: {
                key: 'value'
            }
        };
        agentId = 'agentId123';
        const mockExternalId: ExternalId = {
            id: 1,
            agent_id: agentId,
            external_id: 'foobar',
            external_id_type: 'id_1'
        };
        const mockExternalIdRepository: any = new MockRepository<ExternalId>([mockExternalId]);
        externalIdDbGateway = new ExternalIdDbGateway(mockExternalIdRepository);
    });

    describe('Using an internal Bio Auth Service', () => {
        beforeAll(() => process.env.EXTERNAL_BIO_AUTH = 'false');

        it('should be able to verify an image', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const mockExternalControllerService = new MockExternalControllerService();
            const fpPlugin = new FingerprintPlugin(bioAuthService, externalIdDbGateway, mockExternalControllerService);
            const result = await fpPlugin.verify(verifyImageParams, verifyFilters);
            expect(result.status).toBe('matched');
            expect(result.id).toBe(agentId);
        });

        it('should be able to verify a template', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const mockExternalControllerService = new MockExternalControllerService();
            const fpPlugin = new FingerprintPlugin(bioAuthService, externalIdDbGateway, mockExternalControllerService);
            const result = await fpPlugin.verify(verifyTemplateParams, verifyFilters);
            expect(result.status).toBe('matched');
            expect(result.id).toBe(agentId);
        });

        it('If status is other than "matched" ProtocolException will be thrown ', async () => {
            const bioAuthService = new MockBioAuthService('not_matched', agentId);
            const mockExternalControllerService = new MockExternalControllerService();
            const fpPlugin = new FingerprintPlugin(bioAuthService, externalIdDbGateway, mockExternalControllerService);
            try {
                await fpPlugin.verify(verifyImageParams, verifyFilters);
                fail('Expected a ProtocolException to be thrown.');
            } catch (err) {
                expect(err).toBeInstanceOf(ProtocolException);
            }
        });

        it('If fingerprint "FINGERPRINT_NO_MATCH" is thrown should throw a "ProtocolException"', async () => {
            const bioAuthService = new class extends MockBioAuthService {
                async verifyFingerprint(position: number, image: string, externalIds: ExternalId[]): Promise<any> {
                    throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NO_MATCH, 'msg');
                }
            }('matched', agentId);
            const mockExternalControllerService = new MockExternalControllerService();
            const fpPlugin = new FingerprintPlugin(bioAuthService, externalIdDbGateway, mockExternalControllerService);
            try {
                await fpPlugin.verify(verifyImageParams, verifyFilters);
                fail('Expected a ProtocolException to be thrown.');
            } catch (err) {
                expect(err).toBeInstanceOf(ProtocolException);
            }
        });
    });

    describe('Using an external Bio Auth Service', () => {
        beforeAll(() => process.env.EXTERNAL_BIO_AUTH = 'true');

        it('should be able to verify an image', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const mockExternalControllerService = new MockExternalControllerService();
            const fpPlugin = new FingerprintPlugin(bioAuthService, externalIdDbGateway, mockExternalControllerService);
            const result = await fpPlugin.verify(verifyImageParams, verifyFilters);
            expect(result.status).toBe('matched');
            expect(result.id).toBe(agentId);
        });

        it('should fail to verify a template', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const mockExternalControllerService = new MockExternalControllerService();
            const fpPlugin = new FingerprintPlugin(bioAuthService, externalIdDbGateway, mockExternalControllerService);
            try {
                await fpPlugin.verify(verifyTemplateParams, verifyFilters);
                fail('Expected a ProtocolException to be thrown.');
            } catch (err) {
                expect(err).toBeInstanceOf(ProtocolException);
            }
        });
    });
});
