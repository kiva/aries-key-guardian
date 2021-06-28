import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import assert from 'assert';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { EscrowController } from '../../src/escrow/escrow.controller';
import { EscrowService } from '../../src/escrow/escrow.service';
import { WalletCredentials } from '../../src/db/entity/wallet.credentials';
import { PluginFactory } from '../../src/plugins/plugin.factory';
import { IAgencyService } from '../../src/remote/agency.service.interface';
import { IBioAuthService } from '../../src/remote/bio.auth.service.interface';
import { MockAgencyService } from '../mock/mock.agency.service';
import { MockBioAuthService } from '../mock/mock.bio.auth.service';
import { MockRepository } from '../mock/mock.repository';
import { ExternalId } from '../../src/db/entity/external.id';
import { ExternalIdDbGateway } from '../../src/db/external.id.db.gateway';
import { WalletCredentialsDbGateway } from '../../src/db/wallet.credentials.db.gateway';

/**
 * This mocks out external dependencies (e.g. Db)
 */
describe('EscrowController (e2e) using fingerprint plugin', () => {
    let app: INestApplication;
    let body: any;
    let status: string;
    let agentId: string;

    beforeAll(async () => {
        jest.setTimeout(10000);

        status = 'matched';
        agentId = 'agentId123'; // Right now Bio Auth Service returns agentId, eventually it will return agentId

        const mockAgencyService = new MockAgencyService('foo');
        const mockBioAuthService = new MockBioAuthService(status, agentId);

        // Set up ExternalId repository
        const mockExternalId = new ExternalId();
        mockExternalId.agent_id = agentId;
        mockExternalId.external_id = 'abc123';
        mockExternalId.external_id_type = 'sl_national_id';
        const mockExternalIdRepository = new MockRepository<ExternalId>([mockExternalId]);

        // Set up WalletCredentials repository
        const mockWalletCredentials = new WalletCredentials();
        mockWalletCredentials.agent_id = agentId;
        mockWalletCredentials.wallet_id = 'abc';
        mockWalletCredentials.wallet_key = '123';
        mockWalletCredentials.seed = '';
        const mockWalletCredentialsRepository = new MockRepository<WalletCredentials>([mockWalletCredentials]);

        body = {
            pluginType: 'FINGERPRINT',
            filters: {
                externalIds: {
                    'sl_national_id': 'abc123'
                }
            },
            params: {
                position: 1,
                image: 'base64_encoded_image',
            }
        };

        const module = await Test.createTestingModule({
            imports: [],
            controllers: [EscrowController],
            providers: [
                EscrowService,
                ExternalIdDbGateway,
                WalletCredentialsDbGateway,
                {
                    provide: getRepositoryToken(ExternalId),
                    useValue: mockExternalIdRepository
                },
                {
                    provide: getRepositoryToken(WalletCredentials),
                    useValue: mockWalletCredentialsRepository,
                },
                {
                    provide: IAgencyService,
                    useValue: mockAgencyService,
                },
                {
                    provide: IBioAuthService,
                    useValue: mockBioAuthService
                },
                PluginFactory,
            ],
        }).compile();

        app = module.createNestApplication();
        // Need to apply exception filter for correct error handling
        app.useGlobalFilters(new ProtocolExceptionFilter());
        await app.init();
    });

    it('Verify endpoint (fingerprint image)', () => {
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(body)
            .expect(201)
            .then((res) => {
                assert.equal(res.body.status, 'matched');
                assert.equal(res.body.id, agentId);
            });
    });

    it('Verify endpoint (fingerprint template)', () => {
        const templateBody = {
            ...body,
            params: {
                position: 1,
                template: 'base64_encoded_template'
            }
        };
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(templateBody)
            .expect(201)
            .then((res) => {
                assert.equal(res.body.status, 'matched');
                assert.equal(res.body.id, agentId);
            });
    });

    it('Create endpoint', () => {
        body.id = 'agentIdxyz';
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(body)
            .expect(201)
            .then((res) => {
                // We can't predict the exact value since it will be random
                expect(res.body.id).toBeDefined();
            });
    });

    it('Add endpoint', () => {
        return request(app.getHttpServer())
            .post('/v1/escrow/add')
            .send(body)
            .expect(201)
            .then((res) => {
                assert.equal(res.body.result, 'success');
            });
    });
});
