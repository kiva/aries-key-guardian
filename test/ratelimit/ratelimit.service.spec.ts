import { RateLimitService } from '../../dist/ratelimit/ratelimit.service.js';
import cacheManager from 'cache-manager';
import { RateLimitBucket } from '../../dist/ratelimit/ratelimit.bucket.js';
import { RateLimitConfigService } from '../../dist/ratelimit/ratelimit.config.service.js';
import { randomString } from 'protocol-common';
import data from '../support/ratelimit.config.test.json';

describe('Rate Limit Service', () => {

    const memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 10/* seconds*/});
    const rateLimitConfigService = new RateLimitConfigService(data);
    const service: RateLimitService = new RateLimitService(memoryCache, rateLimitConfigService);
    const bucket = RateLimitBucket.VERIFY_OTP;
    const config = rateLimitConfigService.getConfig(bucket);

    it('should not limit if fewer than the max number of attempts have been made', async () => {
        const key = randomString();

        await service.addAttempt(bucket, key);
        const result = await service.shouldLimit(bucket, key);

        expect(result).toBe(false);
    });

    it('should limit if the max number of attempts have been made in the configured window', async () => {
        const key = randomString();

        for (let i = 0; i < config.limit; i++) {
            await service.addAttempt(bucket, key);
        }
        const result = await service.shouldLimit(bucket, key);

        expect(result).toBe(true);
    });

    it('should not limit if the "last" attempt occurs after the previous attempts have expires', async () => {
        const key = randomString();

        for (let i = 0; i < config.limit - 1; i++) {
            await service.addAttempt(bucket, key);
        }
        await new Promise(resolve => setTimeout(resolve, (config.ttl + 1) * 1000));
        await service.addAttempt(bucket, key);
        const result = await service.shouldLimit(bucket, key);
        expect(result).toBe(false);
    }, (config.ttl + 2) * 1000);

    it('should limit if the max number of attempts were attempted, but expired, and the block period has not yet expired', async () => {
        const key = randomString();

        for (let i = 0; i < config.limit; i++) {
            await service.addAttempt(bucket, key);
        }
        await new Promise(resolve => setTimeout(resolve, (config.ttl + 1) * 1000));
        const result = await service.shouldLimit(bucket, key);
        expect(result).toBe(true);
    }, (config.ttl + 2) * 1000);
});
