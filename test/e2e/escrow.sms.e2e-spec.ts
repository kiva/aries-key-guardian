import request from 'supertest';
import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER, INestApplication } from '@nestjs/common';
import { RateLimitModule } from '../../dist/ratelimit/ratelimit.module.js';
import { EscrowService } from '../../dist/escrow/escrow.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletCredentials } from '../../dist/db/entity/wallet.credentials.js';
import { EscrowController } from '../../dist/escrow/escrow.controller.js';
import { PluginFactory } from '../../dist/plugins/plugin.factory.js';
import { MockAgencyService } from '../../dist/remote/impl/mock.agency.service.js';
import { IAgencyService } from '../../dist/remote/agency.service.interface.js';
import { SmsService } from '../../dist/sms/sms.service.js';
import { SmsOtp } from '../../dist/db/entity/sms.otp.js';
import cacheManager from 'cache-manager';
import { MockRepository } from '../../dist/db/mock.repository.js';
import { ISmsService } from '../../dist/remote/sms.service.interface.js';
import { MockSmsHelperService } from '../../dist/sms/mock.sms.helper.service.js';
import { SmsHelperService } from '../../dist/sms/sms.helper.service.js';
import { SmsDisabledService } from '../../dist/remote/impl/sms.disabled.service.js';
import { ExternalId } from '../../dist/db/entity/external.id.js';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { ExternalIdDbGateway } from '../../dist/db/external.id.db.gateway.js';
import typeorm from 'typeorm';
import { SmsOtpDbGateway } from '../../dist/db/sms.otp.db.gateway.js';
import { WalletCredentialsDbGateway } from '../../dist/db/wallet.credentials.db.gateway.js';
import { MockExternalControllerService } from '../../dist/remote/impl/mock.external.controller.service.js';
import { IExternalControllerService } from '../../dist/remote/external.controller.service.interface.js';
import { ProtocolErrorCode, ProtocolExceptionFilter, SecurityUtility } from 'protocol-common';

jest.setTimeout(10000);

const pepperHash = (input: string) => {
    return SecurityUtility.hash32(`${input}${process.env.HASH_PEPPER}`);
};

const now = (): Date => {
    return new Date(Date.now());
};

/**
 * This mocks out external dependencies (eg Twillio, DB)
 */
describe('EscrowController (e2e) using SMS plugin', () => {
    let app: INestApplication;
    let responseId: string;
    let otp: number;
    let id1: string;
    let id2: number;
    let agentId: string;
    let phoneNumber: string;
    let pluginType: string;

    const buildCreateRequest: () => any = () => {
        return {
            pluginType,
            filters: {
                externalIds: {
                    id_1: id1,
                    id_2: id2
                }
            },
            params: {
                phoneNumber,
            }
        };
    };

    const buildVerifyRequest: () => any = () => {
        return {
            pluginType,
            filters: {
                externalIds: {
                    id_1: id1
                }
            },
            params: {
                phoneNumber
            }
        };
    };

    beforeAll(async () => {
        process.env.OTP_EXPIRE_MS = '10000';
        process.env.FILESYSTEM_CACHE_PATH =  '/tmp/diskcache';
        process.env.GLOBAL_CACHE_TTL = '60';
        process.env.GLOBAL_CACHE_MAX = '1000000';

        // Constants for use throughout the test suite
        id2 = 1000000 + parseInt(now().toString().substr(7, 6), 10); // Unique 7 digit number that doesn't start with 0
        const id2Hash = pepperHash(`${id2}`);
        id1 = `N${id2}`;
        const id1Hash = pepperHash(id1);
        otp = 123456;
        agentId = 'agentId123';
        phoneNumber = '+12025550114';
        pluginType = 'SMS_OTP';

        // Set up ExternalId repository
        const mockExternalId1 = new ExternalId();
        mockExternalId1.agent_id = agentId;
        mockExternalId1.external_id = id1Hash;
        mockExternalId1.external_id_type = 'id_1';
        const mockExternalId2 = new ExternalId();
        mockExternalId2.agent_id = agentId;
        mockExternalId2.external_id = id2Hash;
        mockExternalId2.external_id_type = 'id_2';
        const mockExternalIdRepository = new class extends MockRepository<ExternalId> {

            externalIdFilter(externalId: ExternalId, conditions?: FindConditions<ExternalId>): boolean {
                const values = conditions.external_id instanceof typeorm.FindOperator && conditions.external_id.type === 'in' ?
                    conditions.external_id.value :
                    [conditions.external_id];
                return (values as string[]).some((value: string) => value === externalId.external_id) &&
                    conditions.external_id_type === externalId.external_id_type;
            }

            async findOne(conditions?: FindConditions<ExternalId>): Promise<ExternalId | undefined> {
                const externalIds = await super.find(conditions);
                return externalIds.find((externalId: ExternalId) => this.externalIdFilter(externalId, conditions));
            }

            async find(conditions?: FindConditions<ExternalId>): Promise<ExternalId[]> {
                const externalIds = await super.find(conditions);
                return externalIds.filter((externalId: ExternalId) => this.externalIdFilter(externalId, conditions));
            }
        }([mockExternalId1, mockExternalId2]);

        // Set up WalletCredentials repository
        const mockWalletCredentials = new WalletCredentials();
        mockWalletCredentials.agent_id = agentId;
        mockWalletCredentials.wallet_id = 'abc';
        mockWalletCredentials.wallet_key = '123';
        const mockWalletCredentialsRepository = new MockRepository<WalletCredentials>([mockWalletCredentials]);

        // Set up SmsOtp repository
        const mockSmsOtp = new SmsOtp();
        const mockSmsOtpRepository = new class extends MockRepository<SmsOtp> {

            async findOne(conditions?: FindConditions<SmsOtp>): Promise<SmsOtp | undefined> {
                const smsOtp = await super.findOne(conditions);
                const agentIdMatches: boolean = !conditions.agent_id || smsOtp.agent_id === conditions.agent_id;
                const phoneNumberHashMatches: boolean = !conditions.phone_number_hash || smsOtp.phone_number_hash === conditions.phone_number_hash;
                if (agentIdMatches && phoneNumberHashMatches) {
                    return smsOtp;
                } else {
                    return undefined;
                }
            }

            async save(input: SmsOtp): Promise<SmsOtp> {
                this.entities = this.entities.filter((entity: SmsOtp) => entity.id !== input.id);
                return super.save(input);
            }
        }([mockSmsOtp]);

        // Cache for rate limiting
        const memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 10/* seconds*/});

        // Mock Services
        const mockAgencyService = new MockAgencyService('foo');
        const mockSmsHelperService = new MockSmsHelperService(otp);
        const mockExternalControllerService = new MockExternalControllerService(agentId);

        // Tie together application with mocked and actual dependencies
        const moduleFixture = await Test.createTestingModule({
            imports: [RateLimitModule],
            controllers: [EscrowController],
            providers: [
                EscrowService,
                SmsService,
                SmsOtpDbGateway,
                ExternalIdDbGateway,
                WalletCredentialsDbGateway,
                PluginFactory,
                {
                    provide: CACHE_MANAGER,
                    useValue: memoryCache
                },
                {
                    provide: getRepositoryToken(ExternalId),
                    useValue: mockExternalIdRepository
                },
                {
                    provide: getRepositoryToken(WalletCredentials),
                    useValue: mockWalletCredentialsRepository
                },
                {
                    provide: getRepositoryToken(SmsOtp),
                    useValue: mockSmsOtpRepository
                },
                {
                    provide: IAgencyService,
                    useValue: mockAgencyService
                },
                {
                    provide: ISmsService,
                    useClass: SmsDisabledService
                },
                {
                    provide: SmsHelperService,
                    useValue: mockSmsHelperService
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

    it('Create endpoint fails with invalid parameters', () => {
        const data = buildCreateRequest();
        data.params.phoneNumber = 'foobar'; // invalid
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.VALIDATION_EXCEPTION);
            });
    });

    it('Create endpoint fails with invalid filters', () => {
        const data = buildCreateRequest();
        data.filters.externalIds.id_1 = {'foo': 'bar'};
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.VALIDATION_EXCEPTION);
            });
    });

    it('Create endpoint succeeds with valid parameters', () => {
        const data = buildCreateRequest();
        data.params.phoneNumber = '+12025550156'; // Will be overwritten by the next test
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(data)
            .expect(201)
            .then((res) => {
                // We can't predict the exact value since it will be random
                expect(res.body.id).toBeDefined();
                responseId = res.body.id;
            });
    });

    it('Update phone number', () => {
        const data = buildCreateRequest(); // Overwrites the phone number from the previous test
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(data)
            .expect(201)
            .then((res) => {
                expect(res.body.id).toBeDefined();
                expect(res.body.id).toEqual(responseId);
            });
    });

    // -- Send -- //

    it('Verify sms sent', () => {
        const data = buildVerifyRequest();
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(201)
            .then((res) => {
                expect(res.body.status).toBe('sent');
                expect(res.body.id).toBe(null);
            });
    });

    it('Error case: Invalid ID leads to NO_CITIZEN_FOUND', () => {
        const data = buildVerifyRequest();
        data.filters.externalIds.id_1 = 'BAD_ID';
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.NO_CITIZEN_FOUND);
            });
    });

    it('Error case: Invalid phone number leads to NO_CITIZEN_FOUND', () => {
        const data = buildVerifyRequest();
        data.params.phoneNumber = '+23276543210';
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.NO_CITIZEN_FOUND);
            });
    });

    it('Error case: No phone number leads to ValidationException', () => {
        const data = buildVerifyRequest();
        delete data.params.phoneNumber;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.VALIDATION_EXCEPTION);
            });
    });

    // -- Match -- //

    it('Error case: Incorrect OTP leads to OTP_NO_MATCH', () => {
        const data = buildVerifyRequest();
        delete data.params.phoneNumber;
        data.params.otp = 111111;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.OTP_NO_MATCH);
            });
    });

    it('Verify otp matches', () => {
        const data = buildVerifyRequest();
        delete data.params.phoneNumber;
        data.params.otp = otp;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(201)
            .then((res) => {
                expect(res.body.status).toBe('matched');
                expect(res.body.id).toBe(responseId);
            });
    }, 10000);

    it('Error case: Expired OTP leads to OTP_NO_MATCH', () => {
        const data = buildVerifyRequest();
        delete data.params.phoneNumber;
        data.params.otp = otp;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.OTP_NO_MATCH);
            });
    });

    afterAll(async () => {
        await app.close();
    });
});
