import { Inject, Injectable, Logger } from '@nestjs/common';
import { RateLimitBucket } from './ratelimit.bucket.js';
import { RateLimitConfig } from './ratelimit.config.js';
import { ProtocolErrorCode, ProtocolException } from 'protocol-common';

@Injectable()
export class RateLimitConfigService {
    private readonly configs: Map<RateLimitBucket, RateLimitConfig>;

    constructor(@Inject('BASE_RATE_LIMIT_CONFIG') data: any) {
        this.configs = new Map<RateLimitBucket, RateLimitConfig>();
        for (const key of Object.keys(data)) {
            switch (RateLimitBucket[key]) {
                case RateLimitBucket.SEND_OTP:
                    this.configs.set(RateLimitBucket.SEND_OTP, data[key] as RateLimitConfig);
                    break;
                case RateLimitBucket.VERIFY_OTP:
                    this.configs.set(RateLimitBucket.VERIFY_OTP, data[key] as RateLimitConfig);
                    break;
                default:
                    throw new Error(`Unexpected rate limit config value ${key} is not a valid RateLimitBucket`);
            }
        }
    }

    /**
     * Get the rate limit configuration for a given bucket, if one exists. If not, throw a ProtocolException.
     */
    public getConfig(bucket: RateLimitBucket): RateLimitConfig {
        const config = this.configs.get(bucket);
        if (!config) {
            Logger.warn(`No suitable configuration found for ${bucket}`);
            throw new ProtocolException(ProtocolErrorCode.RATE_LIMIT_CONFIGURATION, `No suitable configuration found for '${bucket}'`);
        } else {
            return config;
        }
    }
}
