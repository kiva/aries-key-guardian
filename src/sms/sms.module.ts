import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsOtp } from '../entity/sms.otp';
import { RateLimitModule } from '../ratelimit/ratelimit.module';
import { RemoteModule } from '../remote/remote.module';
import { SmsHelperService } from './sms.helper.service';

/**
 * The SMS module doesn't expose any endpoints of it's own so doesn't need a controller
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([SmsOtp]),
        RateLimitModule,
        RemoteModule
    ],
    providers: [SmsService, SmsHelperService],
    exports: [SmsService]
})
export class SmsModule {}
