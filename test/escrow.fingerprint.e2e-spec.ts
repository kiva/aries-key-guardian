import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, HttpService } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import assert from 'assert';
import { ProtocolExceptionFilter } from '@kiva/protocol-common/protocol.exception.filter';
import { EscrowController } from '../src/escrow/escrow.controller';
import { EscrowService } from '../src/escrow/escrow.service';
import { WalletCredentials } from '../src/entity/wallet.credentials';
import { SmsService } from '../src/sms/sms.service';
import { SmsOtp } from '../src/entity/sms.otp';
import { PluginFactory } from '../src/plugins/plugin.factory';

/**
 * This requires mocking out the identity service http response
 * @tothink the auth service uses assert while everything else uses expect... should we switch
 */
describe('EscrowController (e2e) using fingerprint plugin', () => {
    let app: INestApplication;
    let data: any;
    let status: string;
    let did: string;

    beforeAll(async () => {
        status = 'matched';
        did = 'agentId123'; // Right now identity service returns did, eventually it will return agentId
        const mockHttp = {
            request: () => {
                return {
                    toPromise: () => {
                        return Promise.resolve({
                            data: {
                                status,
                                did
                            },
                        });
                    }
                }
            }
        };
        const mockRepository = {
            findOne: () => {
                return {
                    did: 'agentId123',
                    wallet_id: 'abc',
                    wallet_key: '123',
                };
            },
            count: () => {
                return 1;
            },
            save: () => {
                return true;
            }
        };

        data = {
            pluginType: 'FINGERPRINT',
            filters: {
                nationalId: 'abc123',
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
                {
                    provide: getRepositoryToken(WalletCredentials),
                    useValue: mockRepository,
                },
                {
                    provide: HttpService,
                    useValue: mockHttp,
                },
                PluginFactory,
            ],
        }).compile();

        app = module.createNestApplication();
        // Need to apply exception filter for correct error handling
        app.useGlobalFilters(new ProtocolExceptionFilter());
        await app.init();
    });

    it('Verify endpoint', () => {
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(201)
            .then((res) => {
                assert.equal(res.body.status, 'matched');
                assert.equal(res.body.id, 'agentId123');
            });
    });

    it('Create endpoint', () => {
        data.id = 'agentIdxyz'
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(data)
            .expect(201)
            .then((res) => {
                // We can't predict the exact value since it will be random
                expect(res.body.id).toBeDefined();
            });
    });

    it('Add endpoint', () => {
        return request(app.getHttpServer())
            .post('/v1/escrow/add')
            .send(data)
            .expect(201)
            .then((res) => {
                assert.equal(res.body.result, 'success');
            });
    });
});
