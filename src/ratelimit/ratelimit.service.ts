import { CACHE_MANAGER, CacheStore, Inject, Injectable } from '@nestjs/common';
import { RateLimitBucket } from './ratelimit.bucket.js';
import { RateLimitConfigService } from './ratelimit.config.service.js';
import { SecurityUtility } from 'protocol-common';

@Injectable()
export class RateLimitService {

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cache: CacheStore,
        private readonly rateLimitConfigService: RateLimitConfigService
    ) { }

    /**
     * Private helper function to generate a deterministic key for a given bucket and key.
     */
    private static makeCacheKey(bucket: RateLimitBucket, key: string): string {
        return SecurityUtility.hash32(`${bucket}-${key}${process.env.HASH_PEPPER}`);
    }

    /**
     * Record an attempt at a task that rate limiting should apply to. If the configured threshold has been passed, that will also be recorded.
     */
    public async addAttempt(bucket: RateLimitBucket, key: string): Promise<void> {
        const config = this.rateLimitConfigService.getConfig(bucket);
        const baseCacheKey: string = RateLimitService.makeCacheKey(bucket, key);
        const blockedCacheKey = `blocked${baseCacheKey}`;
        const now = Date.now();
        const oneMinAgo = now - (config.ttl * 1000); // ttl is in seconds, but the timestamp is in milliseconds

        // Get and Set attempts within the last minute, including this new attempt
        const timestamps: number[] = (await this.cache.get<Array<number>>(baseCacheKey) || new Array<number>())
            .filter((ts: number) => ts.valueOf() > oneMinAgo)
            .concat(now);
        await this.cache.set(baseCacheKey, timestamps, {ttl: config.ttl});

        // Set a longer-living block if there have been too many attempts within the configured range
        if (timestamps.length >= config.limit) {
            await this.cache.set(blockedCacheKey, true, {ttl: config.blockTtl});
        }
    }

    /**
     * Inspect the current state of the cache to determine if a given attempt should be blocked due to rate limiting rules.
     */
    public async shouldLimit(bucket: RateLimitBucket, key: string): Promise<boolean> {
        const baseCacheKey: string = RateLimitService.makeCacheKey(bucket, key);
        const blockedCacheKey = `blocked${baseCacheKey}`;
        return (await this.cache.get<boolean>(blockedCacheKey)) || false;
    }
}
