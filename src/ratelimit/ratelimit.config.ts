export class RateLimitConfig {

    /**
     * How long to keep a record of a failed attempt around for, in seconds.
     */
    readonly ttl: number;

    /**
     * Maximum number of failed attempts, after which the rate limit will apply.
     */
    readonly limit: number;

    /**
     * How long to enforce a block for once the maximum number of failed attempts is reached, in seconds.
     */
    readonly blockTtl: number;
}
