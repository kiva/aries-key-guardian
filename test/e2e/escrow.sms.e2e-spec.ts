import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER, INestApplication } from '@nestjs/common';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { SmsErrorCode } from '../../src/sms/sms.errorcode';
import { RateLimitModule } from '../../src/ratelimit/ratelimit.module';
import { EscrowService } from '../../src/escrow/escrow.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WalletCredentials } from '../../src/entity/wallet.credentials';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { EscrowController } from '../../src/escrow/escrow.controller';
import { PluginFactory } from '../../src/plugins/plugin.factory';
import { MockAgencyService } from '../mock/mock.agency.service';
import { IAgencyService } from '../../src/remote/agency.service.interface';
import { SmsService } from '../../src/sms/sms.service';
import { SmsOtp } from '../../src/entity/sms.otp';
import cacheManager from 'cache-manager';
import { nDaysFromNow, now, pepperHash } from '../support/functions';
import { MockRepository } from '../mock/mock.repository';
import { ISmsService } from '../../src/remote/sms.service.interface';
import { MockSmsHelperService } from '../mock/mock.sms.helper.service';
import { SmsHelperService } from '../../src/sms/sms.helper.service';
import { SmsDisabledService } from '../../src/remote/impl/sms.disabled.service';

/**
 * This mocks out external dependencies (eg Twillio, DB)
 */
describe('EscrowController (e2e) using SMS plugin', () => {
    let app: INestApplication;
    let data: any;
    let agentId: string;
    let otp: number;
    let nationalId: string;
    let voterId: number;
    let did: string;
    let phoneNumber: string;

    beforeAll(async () => {
        jest.setTimeout(10000);
        process.env.OTP_EXPIRE_MS = '10000';

        // Constants for use throughout the test suite
        voterId = 1000000 + parseInt(now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
        const voterIdHash = pepperHash(`${voterId}`);
        nationalId = 'N' + voterId;
        const nationalIdHash = pepperHash(nationalId);
        otp = 123456;
        did = 'agentId123';
        phoneNumber = '+14151234567';
        data = {
            pluginType: 'SMS_OTP',
            filters: {
                govId1: nationalId,
                govId2: voterId,
            },
            params: {
                phoneNumber,
            }
        };

        // Set up WalletCredentials repository
        const mockWalletCredentials = new WalletCredentials();
        mockWalletCredentials.did = did;
        mockWalletCredentials.wallet_id = 'abc';
        mockWalletCredentials.wallet_key = '123';
        const mockWalletCredentialsRepository = new MockRepository<WalletCredentials>(mockWalletCredentials);

        // Set up SmsOtp repository
        const mockSmsOtp = new SmsOtp();
        mockSmsOtp.agent_id = agentId;
        mockSmsOtp.gov_id_1_hash = nationalIdHash;
        mockSmsOtp.gov_id_2_hash = voterIdHash;
        mockSmsOtp.phone_number_hash = pepperHash(phoneNumber);
        mockSmsOtp.otp = otp;
        mockSmsOtp.otp_expiration_time = nDaysFromNow(1);
        const mockSmsOtpRepository = new class extends MockRepository<SmsOtp> {
            find(input: any): any[] {
                return super.find(input).filter(() => input.gov_id_1_hash === nationalIdHash || input.gov_id_2_hash === voterIdHash);
            }
        }(mockSmsOtp);

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
                PluginFactory,
                {
                    provide: CACHE_MANAGER,
                    useValue: memoryCache,
                },
                {
                    provide: getRepositoryToken(WalletCredentials),
                    useValue: mockWalletCredentialsRepository,
                },
                {
                    provide: getRepositoryToken(SmsOtp),
                    useValue: mockSmsOtpRepository,
                },
                {
                    provide: IAgencyService,
                    useValue: mockAgencyService,
                },
                {
                    provide: ISmsService,
                    useClass: SmsDisabledService
                },
                {
                    provide: SmsHelperService,
                    useValue: mockSmsHelperService
                },
            ]
        }).compile();

        app = await moduleFixture.createNestApplication();
        // Need to apply exception filter for correct error handling
        app.useGlobalFilters(new ProtocolExceptionFilter());
        await app.init();
    });

    it('Create endpoint', () => {
        return request(app.getHttpServer())
            .post('/v1/escrow/create')
            .send(data)
            .expect(201)
            .then((res) => {
                // We can't predict the exact value since it will be random
                expect(res.body.id).toBeDefined();
                agentId = res.body.id;
            });
    });

    // -- Send -- //

    it('Verify sms sent', () => {
        delete data.filters.govId2;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(201)
            .then((res) => {
                expect(res.body.status).toBe('sent');
                expect(res.body.id).toBe(null);
            });
    });

    it('Error case: NO_CITIZEN_FOUND', () => {
        data.filters.govId1 = 'BAD_ID';
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(ProtocolErrorCode.NO_CITIZEN_FOUND);
            });
    });

    it('Error case: PHONE_NUMBER_NO_MATCH', () => {
        data.filters.govId1 = nationalId;
        data.params.phoneNumber = '+23276543210';
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(SmsErrorCode.PHONE_NUMBER_NO_MATCH);
            });
    });

    // TODO NO_PHONE_NUMBER

    // -- Match -- //

    it('Error case: OTP_NO_MATCH', () => {
        delete data.params.phoneNumber;
        data.params.otp = 111111;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(SmsErrorCode.OTP_NO_MATCH);
            });
    });

    it('Verify otp matches', () => {
        data.params.otp = otp;
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(201)
            .then((res) => {
                expect(res.body.status).toBe('matched');
                expect(res.body.id).toBe(agentId);
            });
    }, 10000);

    it('Error case: OTP_EXPIRED', () => {
        return request(app.getHttpServer())
            .post('/v1/escrow/verify')
            .send(data)
            .expect(400)
            .then((res) => {
                expect(res.body.code).toBe(SmsErrorCode.OTP_EXPIRED);
            });
    });

    afterAll(async () => {
        await app.close();
    });
});
