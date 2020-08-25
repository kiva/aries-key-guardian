import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module';
import { RateLimitService } from './ratelimit.service';
import { RateLimitConfigService } from './ratelimit.config.service';
import data from '../config/ratelimit.json';

@Module({
    imports: [
        GlobalCacheModule
    ],
    providers: [RateLimitService, {
        provide: 'BASE_RATE_LIMIT_CONFIG',
        useValue: data
    }, RateLimitConfigService],
    exports: [RateLimitService]
})
export class RateLimitModule {}
