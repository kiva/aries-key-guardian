import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { RateLimitModule } from '../ratelimit/ratelimit.module';
import { RemoteModule } from '../remote/remote.module';
import { SmsHelperService } from './sms.helper.service';
import { DbModule } from '../db/db.module';

/**
 * The SMS module doesn't expose any endpoints of it's own so doesn't need a controller
 */
@Module({
    imports: [
        DbModule,
        RateLimitModule,
        RemoteModule
    ],
    providers: [SmsService, SmsHelperService],
    exports: [SmsService]
})
export class SmsModule {}
