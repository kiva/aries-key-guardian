import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import assert from 'assert';
import { EscrowController } from '../../dist/escrow/escrow.controller.js';
import { EscrowService } from '../../dist/escrow/escrow.service.js';
import { WalletCredentials } from '../../dist/db/entity/wallet.credentials.js';
import { PluginFactory } from '../../dist/plugins/plugin.factory.js';
import { IAgencyService } from '../../dist/remote/agency.service.interface.js';
import { IBioAuthService } from '../../dist/remote/bio.auth.service.interface.js';
import { MockAgencyService } from '../mock/mock.agency.service';
import { MockBioAuthService } from '../mock/mock.bio.auth.service';
import { MockRepository } from '../mock/mock.repository';
import { ExternalId } from '../../dist/db/entity/external.id.js';
import { ExternalIdDbGateway } from '../../dist/db/external.id.db.gateway.js';
import { WalletCredentialsDbGateway } from '../../dist/db/wallet.credentials.db.gateway.js';
import { IExternalControllerService } from '../../dist/remote/external.controller.service.interface.js';
import { MockExternalControllerService } from '../mock/mock.external.controller.service';
import { ProtocolExceptionFilter } from 'protocol-common';

/**
 * This mocks out external dependencies (e.g. Db)
 */
describe('EscrowController (e2e) using fingerprint plugin', () => {
    let app: INestApplication;
    let body: any;
    let createdId: any;
    let status: string;
    let agentId: string;

    beforeAll(async () => {
        jest.setTimeout(10000);

        status = 'matched';
        agentId = 'agentId123'; // Right now Bio Auth Service returns agentId, eventually it will return agentId

        const mockAgencyService = new MockAgencyService('foo');
        const mockBioAuthService = new MockBioAuthService(status, agentId);
        const mockExternalControllerService = new MockExternalControllerService(agentId);

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
                {
                    provide: IExternalControllerService,
                    useValue: mockExternalControllerService
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
                createdId = res.body.id;
            });
    });

    it('Recreate same endpoint', () => {
         // reusing the same id as in 'create endpoint' test
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(body)
            .expect(201)
            .then((res) => {
                expect(res.body.id).toBeDefined();
                // we are saving the id returned from 'create endpoint' and it should match
                expect(createdId).toEqual(res.body.id);
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
