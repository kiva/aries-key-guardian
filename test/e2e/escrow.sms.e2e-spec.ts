import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER, INestApplication } from '@nestjs/common';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { RateLimitModule } from '../../src/ratelimit/ratelimit.module';
import { EscrowService } from '../../src/escrow/escrow.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletCredentials } from '../../src/db/entity/wallet.credentials';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { EscrowController } from '../../src/escrow/escrow.controller';
import { PluginFactory } from '../../src/plugins/plugin.factory';
import { MockAgencyService } from '../mock/mock.agency.service';
import { IAgencyService } from '../../src/remote/agency.service.interface';
import { SmsService } from '../../src/sms/sms.service';
import { SmsOtp } from '../../src/db/entity/sms.otp';
import cacheManager from 'cache-manager';
import { now, pepperHash } from '../support/functions';
import { MockRepository } from '../mock/mock.repository';
import { ISmsService } from '../../src/remote/sms.service.interface';
import { MockSmsHelperService } from '../mock/mock.sms.helper.service';
import { SmsHelperService } from '../../src/sms/sms.helper.service';
import { SmsDisabledService } from '../../src/remote/impl/sms.disabled.service';
import { ExternalId } from '../../src/db/entity/external.id';
import { FindConditions } from 'typeorm/find-options/FindConditions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { ExternalIdDbGateway } from '../../src/db/external.id.db.gateway';
import { FindOperator } from 'typeorm';
import { SmsOtpDbGateway } from '../../src/db/sms.otp.db.gateway';
import { WalletCredentialsDbGateway } from '../../src/db/wallet.credentials.db.gateway';
import { MockExternalControllerService } from '../mock/mock.external.controller.service';
import { IExternalControllerService } from '../../dist/remote/external.controller.service.interface';

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
        jest.setTimeout(10000);
        process.env.OTP_EXPIRE_MS = '10000';
        process.env.FILESYSTEM_CACHE_PATH =  '/tmp/diskcache';
        process.env.GLOBAL_CACHE_TTL = '60';
        process.env.GLOBAL_CACHE_MAX = '1000000';

        // Constants for use throughout the test suite
        id2 = 1000000 + parseInt(now().toString().substr(7, 6), 10); // Unique 7 digit number that doesn't start with 0
        const id2Hash = pepperHash(`${id2}`);
        id1 = 'N' + id2;
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
                // @ts-ignore
                const values: string[] = conditions.external_id instanceof FindOperator && conditions.external_id.type === 'in' ?
                    conditions.external_id.value :
                    [conditions.external_id];
                return values.some((value: string) => value === externalId.external_id) &&
                    conditions.external_id_type === externalId.external_id_type;
            }

            async findOne(conditions?: FindConditions<ExternalId>, options?: FindOneOptions<ExternalId>): Promise<ExternalId | undefined> {
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
        const memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 10/*seconds*/});

        // Mock Services
        const mockAgencyService = new MockAgencyService('foo');
        const mockSmsHelperService = new MockSmsHelperService(otp);

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
                    useClass: MockExternalControllerService
                }
            ]
        }).compile();

        app = await moduleFixture.createNestApplication();
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
