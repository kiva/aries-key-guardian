import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { RateLimitService } from './ratelimit.service.js';
import { RateLimitConfigService } from './ratelimit.config.service.js';

// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import data from '../config/ratelimit.json' assert { type: 'json'};

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
