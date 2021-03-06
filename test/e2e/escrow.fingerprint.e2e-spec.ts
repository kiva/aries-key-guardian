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
import { IIdentityService } from '../../src/remote/identity.service.interface';
import { MockAgencyService } from '../mock/mock.agency.service';
import { MockIdentityService } from '../mock/mock.identity.service';
import { MockRepository } from '../mock/mock.repository';
import { ExternalId } from '../../src/db/entity/external.id';
import { ExternalIdRepository } from '../../src/db/external.id.repository';

/**
 * This mocks out external dependencies (e.g. Db)
 */
describe('EscrowController (e2e) using fingerprint plugin', () => {
    let app: INestApplication;
    let body: any;
    let status: string;
    let did: string;

    beforeAll(async () => {
        jest.setTimeout(10000);

        status = 'matched';
        did = 'agentId123'; // Right now identity service returns did, eventually it will return agentId

        const mockAgencyService = new MockAgencyService('foo');
        const mockIdentityService = new MockIdentityService(status, did);

        // Set up ExternalId repository
        const mockExternalId = new ExternalId();
        mockExternalId.did = did;
        mockExternalId.external_id = 'abc123';
        mockExternalId.external_id_type = 'sl_national_id';
        const mockExternalIdRepository = new MockRepository<ExternalId>([mockExternalId]);

        // Set up WalletCredentials repository
        const mockWalletCredentials = new WalletCredentials();
        mockWalletCredentials.did = did;
        mockWalletCredentials.wallet_id = 'abc';
        mockWalletCredentials.wallet_key = '123';
        mockWalletCredentials.seed = '';
        const mockWalletCredentialsRepository = new MockRepository<WalletCredentials>([mockWalletCredentials]);

        body = {
            pluginType: 'FINGERPRINT',
            filters: {
                govId1: 'abc123',
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
                ExternalIdRepository,
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
                    provide: IIdentityService,
                    useValue: mockIdentityService
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
                assert.equal(res.body.id, 'agentId123');
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
                assert.equal(res.body.id, 'agentId123');
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
