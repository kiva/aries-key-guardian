import { Module } from '@nestjs/common';
import { ExternalIdRepository } from './external.id.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { SmsOtpRepository } from './sms.otp.repository';
import { SmsOtp } from './entity/sms.otp';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalId]),
        TypeOrmModule.forFeature([SmsOtp])
    ],
    providers: [ExternalIdRepository, SmsOtpRepository],
    exports: [ExternalIdRepository, SmsOtpRepository]
})
export class DbModule {}
