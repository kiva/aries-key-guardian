import request from 'supertest';
import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { MockJwksService } from '../../dist/remote/impl/mock.jwks.service.js';
import { EscrowController } from '../../dist/escrow/escrow.controller.js';
import { Test } from '@nestjs/testing';
import { EscrowService } from '../../dist/escrow/escrow.service.js';
import { PluginFactory } from '../../dist/plugins/plugin.factory.js';
import { IJwksService } from '../../dist/remote/jwks.service.interface.js';
import { WalletCredentials } from '../../dist/db/entity/wallet.credentials.js';
import { MockRepository } from '../../dist/db/mock.repository.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockAgencyService } from '../../dist/remote/impl/mock.agency.service.js';
import { IAgencyService } from '../../dist/remote/agency.service.interface.js';
import { readFileSync } from 'fs';
import jwt from 'jsonwebtoken';
import { TokenService } from '../../dist/token/token.service.js';
import { PluginTypeEnum } from '../../dist/plugins/plugin.type.enum.js';
import { ExternalId } from '../../dist/db/entity/external.id.js';
import { ExternalIdDbGateway } from '../../dist/db/external.id.db.gateway.js';
import { WalletCredentialsDbGateway } from '../../dist/db/wallet.credentials.db.gateway.js';
import { IExternalControllerService } from '../../dist/remote/external.controller.service.interface.js';
import { MockExternalControllerService } from '../../dist/remote/impl/mock.external.controller.service.js';
import { ProtocolErrorCode, ProtocolExceptionFilter } from 'protocol-common';
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

jest.setTimeout(10000);

describe('EscrowController (e2e) using token plugin', () => {
    let app: INestApplication;
    let agentId: string;
    let privateKey1: string;
    let privateKey2: string;

    const data = (token: string): object => {
        return {
            pluginType: PluginTypeEnum.TOKEN,
            filters: {
                externalIds: {
                    test: 'test'
                }
            },
            params: {
                token
            }
        };
    };

    beforeAll(async () => {
        process.env.JWT_SIGNATURE_ALGORITHM = 'RS256';

        agentId = 'agentId123';
        privateKey1 = readFileSync(__dirname + '/../support/test_id_rsa1').toString('utf-8');
        const publicKey1: string = readFileSync(__dirname + '/../support/test_id_rsa1.pub').toString('utf-8');
        privateKey2 = readFileSync(__dirname + '/../support/test_id_rsa2').toString('utf-8');

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
        const mockWalletCredentialsRepository = new MockRepository<WalletCredentials>([mockWalletCredentials]);

        // Mock Services
        const mockAgencyService = new MockAgencyService('foo');
        const mockJwksService = new MockJwksService(publicKey1);
        const mockExternalControllerService = new MockExternalControllerService(agentId);

        const moduleFixture = await Test.createTestingModule({
            controllers: [EscrowController],
            providers: [
                EscrowService,
                TokenService,
                ExternalIdDbGateway,
                WalletCredentialsDbGateway,
                PluginFactory,
                {
                    provide: getRepositoryToken(ExternalId),
                    useValue: mockExternalIdRepository
                },
                {
                    provide: getRepositoryToken(WalletCredentials),
                    useValue: mockWalletCredentialsRepository
                },
                {
                    provide: IJwksService,
                    useValue: mockJwksService
                },
                {
                    provide: IAgencyService,
                    useValue: mockAgencyService
                },
                {
                    provide: IExternalControllerService,
                    useValue: mockExternalControllerService
                }
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        // Need to apply exception filter for correct error handling
        app.useGlobalFilters(new ProtocolExceptionFilter());
        await app.init();
    });

    it('Can verify an auth token that has been correctly signed', () => {
        const token = jwt.sign({agentId}, privateKey1, {algorithm: 'RS256'});
        const body = data(token);
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(body)
            .expect(201)
            .then((res) => {
                expect(res.body.status).toBe('matched');
                expect(res.body.id).toBe(agentId);
            });
    });

    it('Can reject an auth token that has been signed with the wrong key', () => {
        const token = jwt.sign({agentId}, privateKey2, {algorithm: 'RS256'});
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data(token))
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.INVALID_TOKEN);
                expect(res.body.message).toBe('invalid signature');
            });
    });

    it('Can reject an auth token that has been signed with the wrong algorithm', () => {
        const token = jwt.sign({agentId}, 'sekrit', {algorithm: 'HS512'});
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data(token))
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.INVALID_TOKEN);
                expect(res.body.message).toBe('invalid algorithm');
            });
    });

    it('Can reject an auth token that has expired', async () => {
        const token = jwt.sign({agentId}, privateKey1, {
            algorithm: 'RS256',
            expiresIn: 1 // expire in 1 second
        });
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds so the token expires

        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data(token))
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.INVALID_TOKEN);
                expect(res.body.message).toBe('jwt expired');
            });
    });

    it('Can reject an auth token that doesn\'t specify any agentId', () => {
        const token = jwt.sign({foo: 'bar'}, privateKey1, {algorithm: 'RS256'});
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data(token))
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.MISSING_AGENT_ID);
                expect(res.body.message).toBe('Token does not contain an agentId');
            });
    });

    afterAll(async () => {
        await app.close();
    });
});
