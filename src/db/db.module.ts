import { Module } from '@nestjs/common';
import { ExternalIdDbGateway } from './external.id.db.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { SmsOtpDbGateway } from './sms.otp.db.gateway';
import { SmsOtp } from './entity/sms.otp';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalId]),
        TypeOrmModule.forFeature([SmsOtp])
    ],
    providers: [ExternalIdDbGateway, SmsOtpDbGateway],
    exports: [ExternalIdDbGateway, SmsOtpDbGateway]
})
export class DbModule {}
