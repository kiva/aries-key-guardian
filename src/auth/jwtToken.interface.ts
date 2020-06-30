/**
 * JSON Web Token (JWT) Interface
 * Interface for JWT tokens used to authenticate user identity across the API
 * NOTE: this should match identity_wallet_service/.../jwtToken.interface.ts
 */
export interface JwtToken {
    /** The amount of time in seconds before the current token expires */
    expiresIn: number;
    /** An encrypted string for validating user identity */
    accessToken: string;
    /** It's useful to return the did along with the accessToken */
    did: string;
}
