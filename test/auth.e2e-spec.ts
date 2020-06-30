import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, HttpService } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AES, enc } from 'crypto-js';
import assert from 'assert';
import { ConfigModule } from '@kiva/protocol-common/config.module';
import { traceware } from '@kiva/protocol-common/tracer';
import { ProtocolExceptionFilter } from '@kiva/protocol-common/protocol.exception.filter';
import { RequestContextModule } from '@kiva/protocol-common/http-context/request.context.module';
import { Logger } from '@kiva/protocol-common/logger';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { WalletCredentials } from '../src/entity/wallet.credentials';
import environment from '../src/config/env.json';
import { PluginFactory } from '../src/plugins/plugin.factory';

/**
 * This requires mocking out the identity service http response, the wallet sync service http response, the wallet credentials repository,
 * and the jwt service
 */
describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let data: any;
    let status: string;
    let did: string;

    beforeAll(async () => {
        status = 'matched';
        did = 'did:123';
        const mockHttp = {
            request: () => {
                return {
                    toPromise: () => {
                        return Promise.resolve({
                            data: {
                                status,
                                did,
                                newDid: "on-demand-wallet-did", // for on demand wallet creation
                                nationalId: "abc"
                            },
                        });
                    }
                }
            }
        };
        const mockRepository = {
            findOne: () => {
                return {
                    wallet_id: 'abc',
                    wallet_key: '123',
                };
            }
        };
        // Mocking the signing just makes it easier for us to verify the returned value
        const mockJwt = {
            sign: (payload) => {
                return payload;
            }
        }

        data = {
            position: 1,
            filters: {
                nationalId: 'abc123',
            },
            image: 'base64_encoded_image',
            device: {
                FingerprintSensorSerialNumber: 'xyz',
                TellerComputerUsername: 'bob',
            },
        };

        const module = await Test.createTestingModule({
            imports: [
                ConfigModule.init(environment),
                JwtModule.register({}),
                RequestContextModule,
            ],
            controllers: [AuthController],
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: mockJwt,
                },
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
        // Need to apply excpetion filter for correct error handling
        app.useGlobalFilters(new ProtocolExceptionFilter());
        // since our functions use @Trace, we need to include traceware in
        // unit testing to correctly setup the span contexts
        app.use(traceware('auth-test'));
        await app.init();
    });

    it('v1/auth/fingerprint', () => {
        Logger.info(`expiresIn = ${process.env.JWT_EXPIRE_SECONDS}`);
        return request(app.getHttpServer())
            .post('/v1/auth/fingerprint')
            .send(data)
            .expect(201)
            .then((res) => {
                assert.equal(res.body.expiresIn, 36000);
                // Need to decrypt the payload to inspect the contents
                const bytes = AES.decrypt(res.body.accessToken.payload, process.env.JWT_ENCRYPTION_KEY);
                const decrypted = JSON.parse(bytes.toString(enc.Utf8));
                assert.equal(decrypted.id, 'abc');
                assert.equal(decrypted.key, '123');
            });
    });

    it('fail v1/auth/fingerprint', () => {
        status = 'not_matched';
        return request(app.getHttpServer())
            .post('/v1/auth/fingerprint')
            .send(data)
            .expect(400)
            .then((res) => {
                assert.equal(res.body.code, 'FingerprintNoMatch');
            });
    });

    it('on-demand wallet v1/auth/fingerprint', () => {
        status = 'matched';
        did = null;
        return request(app.getHttpServer())
            .post('/v1/auth/fingerprint')
            .send(data)
            .expect(201);
    });
});
