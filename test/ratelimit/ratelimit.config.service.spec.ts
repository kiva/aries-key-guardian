import { RateLimitConfigService } from '../../src/ratelimit/ratelimit.config.service';
import { RateLimitBucket } from '../../src/ratelimit/ratelimit.bucket';
import { ProtocolException } from 'protocol-common/protocol.exception';
import data from '../support/ratelimit.config.test.json';

describe('Rate Limit Config Service', () => {

    const rateLimitConfigService = new RateLimitConfigService(data);

    it('should be able to retrieve a config by name for all valid buckets', () => {
        const buckets = Object.keys(RateLimitBucket).map(bucket => {
            const config = rateLimitConfigService.getConfig(RateLimitBucket[bucket]);
            expect(config).toBeDefined();
            expect(config.ttl).toBeDefined();
            expect(config.blockTtl).toBeDefined();
            expect(config.limit).toBeDefined();
        });
        expect(buckets.length).toBeGreaterThan(0);
    });

    it('should throw an exception if an invalid bucket\'s configuration is requested', () => {
        const fut = () => rateLimitConfigService.getConfig('foobar' as RateLimitBucket);
        expect(fut).toThrow(ProtocolException);
    });
});