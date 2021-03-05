import { Module } from '@nestjs/common';
import { ExternalIdService } from './external.id.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { SmsOtpService } from './sms.otp.service';
import { SmsOtp } from './entity/sms.otp';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExternalId]),
        TypeOrmModule.forFeature([SmsOtp])
    ],
    providers: [ExternalIdService, SmsOtpService],
    exports: [ExternalIdService, SmsOtpService]
})
export class DbModule {}
