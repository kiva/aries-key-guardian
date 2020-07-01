import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsOtp } from '../entity/sms.otp';
import { TwillioService } from './twillio.service';

/**
 * The SMS module doesn't expose any endpoints of it's own so doesn't need a controller
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([SmsOtp]),
    ],
    providers: [SmsService, TwillioService],
    exports: [SmsService]
})
export class SmsModule {}
