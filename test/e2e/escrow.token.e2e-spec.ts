import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { MockJwksService } from '../mock/mock.jwks.service';
import { EscrowController } from '../../src/escrow/escrow.controller';
import { Test } from '@nestjs/testing';
import { EscrowService } from '../../src/escrow/escrow.service';
import { PluginFactory } from '../../src/plugins/plugin.factory';
import { IJwksService } from '../../src/remote/jwks.service.interface';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { WalletCredentials } from '../../src/entity/wallet.credentials';
import { MockRepository } from '../mock/mock.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockAgencyService } from '../mock/mock.agency.service';
import { IAgencyService } from '../../src/remote/agency.service.interface';
import { readFileSync } from 'fs';
import * as jwt from 'jsonwebtoken';
import { TokenService } from '../../src/token/token.service';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';

describe('EscrowController (e2e) using token plugin', () => {
    let app: INestApplication;
    let agentId: string;
    let privateKey1: Buffer;
    let privateKey2: Buffer;

    function data(token: string): object {
        return {
            pluginType: 'AUTH0',
            filters: {},
            params: {
                token
            }
        };
    }

    beforeAll(async () => {
        jest.setTimeout(10000);
        process.env.AUTH0_ALGORITHM = 'RS256';

        agentId = 'agentId123';
        privateKey1 = readFileSync(__dirname + '/../support/test_id_rsa1');
        const publicKey1: Buffer = readFileSync(__dirname + '/../support/test_id_rsa1.pub');
        privateKey2 = readFileSync(__dirname + '/../support/test_id_rsa2');

        // Set up WalletCredentials repository
        const mockWalletCredentials = new WalletCredentials();
        mockWalletCredentials.did = agentId;
        mockWalletCredentials.wallet_id = 'abc';
        mockWalletCredentials.wallet_key = '123';
        const mockWalletCredentialsRepository = new MockRepository<WalletCredentials>(mockWalletCredentials);

        // Mock Services
        const mockAgencyService = new MockAgencyService('foo');
        const mockJwksService = new MockJwksService(publicKey1);

        const moduleFixture = await Test.createTestingModule({
            controllers: [EscrowController],
            providers: [
                EscrowService,
                TokenService,
                PluginFactory,
                {
                    provide: getRepositoryToken(WalletCredentials),
                    useValue: mockWalletCredentialsRepository,
                },
                {
                    provide: IJwksService,
                    useValue: mockJwksService
                },
                {
                    provide: IAgencyService,
                    useValue: mockAgencyService,
                }
            ]
        }).compile();

        app = await moduleFixture.createNestApplication();
        // Need to apply exception filter for correct error handling
        app.useGlobalFilters(new ProtocolExceptionFilter());
        await app.init();
    });

    it('Can verify an auth token that has been correctly signed', () => {
        const token = jwt.sign({agentId}, privateKey1, {algorithm: 'RS256'});
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data(token))
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

    it('Can reject an auth token that has been signed with the algorithm', () => {
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
