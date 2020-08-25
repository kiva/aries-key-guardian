import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { AppModule } from '../src/app/app.module';
import { AppService } from '../src/app/app.service';
import { TwillioService } from '../src/sms/twillio.service';
import { SmsErrorCode } from '../src/sms/sms.errorcode';

/**
 * This mocks out external dependencies (eg Twillio) but not internal ones (eg DB)
 * Note that it expects the tests to run in order so that the first test inserts data that is later tested by other tests
 * TODO at the end we should clean up DB data
 * Note: This test needs to be run inside the docker container in order to connect to the DB
 * TODO figure out a way to get this test passing when run from a Mac
 */
describe('EscrowController (e2e) using SMS plugin', () => {
    let app: INestApplication;
    let data: any;
    let agentId: string;
    let otp: number;
    let nationalId: string;

    beforeAll(async () => {
        jest.setTimeout(10000);

        const voterId = 1000000 + parseInt(Date.now().toString().substr(7, 6), 10); // Predictable and unique exact 7 digits that doesn't start with 0
        nationalId = 'N' + voterId;
        otp = 123456;
        data = {
            pluginType: 'SMS_OTP',
            filters: {
                govId1: nationalId,
                govId2: voterId,
            },
            params: {
                phoneNumber: '+14151234567',
            }
        };

        const mockTwillio = {
            generateRandomOtp: () => {
                return otp;
            },
            sendOtp: () => { },
        };

        const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
            .overrideProvider('TwillioService')
            .useValue(mockTwillio)
            .compile();
        app = await moduleFixture.createNestApplication();
        await AppService.setup(app);
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
