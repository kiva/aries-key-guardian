import { VerifyFiltersDto } from '../../dist/plugins/dto/verify.filters.dto.js';
import { FingerprintPlugin } from '../../dist/plugins/impl/fingerprint.plugin.js';
import { MockBioAuthService } from '../../dist/remote/impl/mock.bio.auth.service.js';
import { VerifyFingerprintImageDto } from '../../dist/plugins/dto/verify.fingerprint.image.dto.js';
import { VerifyFingerprintTemplateDto } from '../../dist/plugins/dto/verify.fingerprint.template.dto.js';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';

describe('Fingerprint Plugin', () => {
    let verifyImageParams: VerifyFingerprintImageDto;
    let verifyTemplateParams: VerifyFingerprintTemplateDto;
    let verifyFilters: VerifyFiltersDto;
    let agentId: string;
    const externalId = 'value';
    const externalIdType = 'key';

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
                [externalIdType]: externalId
            }
        };
        agentId = 'agentId123';
    });

    describe('Using an internal Bio Auth Service', () => {
        beforeAll(() => process.env.EXTERNAL_BIO_AUTH = 'false');

        it('should be able to verify an image', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const fpPlugin = new FingerprintPlugin(bioAuthService);
            const result = await fpPlugin.verify([agentId], verifyImageParams, verifyFilters);
            expect(result.status).toBe('matched');
            expect(result.id).toBe(agentId);
        });

        it('should be able to verify a template', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const fpPlugin = new FingerprintPlugin(bioAuthService);
            const result = await fpPlugin.verify([agentId], verifyTemplateParams, verifyFilters);
            expect(result.status).toBe('matched');
            expect(result.id).toBe(agentId);
        });

        it('If status is other than "matched" ProtocolException will be thrown ', async () => {
            const bioAuthService = new MockBioAuthService('not_matched', agentId);
            const fpPlugin = new FingerprintPlugin(bioAuthService);
            try {
                await fpPlugin.verify([agentId], verifyImageParams, verifyFilters);
                fail('Expected a ProtocolException to be thrown.');
            } catch (err) {
                expect(err).toBeInstanceOf(ProtocolException);
            }
        });

        it('If fingerprint "FINGERPRINT_NO_MATCH" is thrown should throw a "ProtocolException"', async () => {
            const bioAuthService = new class extends MockBioAuthService {
                verifyFingerprint(): Promise<any> {
                    throw new ProtocolException(ProtocolErrorCode.FINGERPRINT_NO_MATCH, 'msg');
                }
            }('matched', agentId);
            const fpPlugin = new FingerprintPlugin(bioAuthService);
            try {
                await fpPlugin.verify([agentId], verifyImageParams, verifyFilters);
                fail('Expected a ProtocolException to be thrown.');
            } catch (err) {
                expect(err).toBeInstanceOf(ProtocolException);
            }
        });
    });

    describe('Using an external Bio Auth Service', () => {
        beforeAll(() => process.env.EXTERNAL_BIO_AUTH = 'true');

        it('should be able to verify an image', async () => {
            const status = 'matched';
            const bioAuthService = new class extends MockBioAuthService {
                verifyFingerprint(): Promise<any> {
                    return Promise.resolve({
                        data: {
                            status,
                            externalId,
                            externalIdType
                        }
                    });
                }
            }(status, agentId);
            const fpPlugin = new FingerprintPlugin(bioAuthService);
            const result = await fpPlugin.verify([agentId], verifyImageParams, verifyFilters);
            expect(result.status).toBe(status);
            expect(result.id).toBe(externalId);
            expect(result.idType).toBe(externalIdType);
        });

        it('should fail to verify a template', async () => {
            const bioAuthService = new MockBioAuthService('matched', agentId);
            const fpPlugin = new FingerprintPlugin(bioAuthService);
            try {
                await fpPlugin.verify([agentId], verifyTemplateParams, verifyFilters);
                fail('Expected a ProtocolException to be thrown.');
            } catch (err) {
                expect(err).toBeInstanceOf(ProtocolException);
            }
        });
    });
});
