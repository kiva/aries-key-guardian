import { Module } from '@nestjs/common';
import { ExternalIdGateway } from './external.id.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { SmsOtpGateway } from './sms.otp.gateway';
import { SmsOtp } from './entity/sms.otp';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalId]),
        TypeOrmModule.forFeature([SmsOtp])
    ],
    providers: [ExternalIdGateway, SmsOtpGateway],
    exports: [ExternalIdGateway, SmsOtpGateway]
})
export class DbModule {}
