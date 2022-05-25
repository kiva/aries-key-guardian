import { Module } from '@nestjs/common';
import { SmsService } from './sms.service.js';
import { RateLimitModule } from '../ratelimit/ratelimit.module.js';
import { RemoteModule } from '../remote/remote.module.js';
import { SmsHelperService } from './sms.helper.service.js';
import { DbModule } from '../db/db.module.js';

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
