/**
 * JwtPayload Interface
 * --------------------
 *
 * Used to request (or validate) secure JWT tokens
 */
export interface JwtPayload {
    /** The ID of the wallet associated to the JWT */
    id: string;
    /** The key for the wallet associated to the JWT */
    key: string;
    /** The JWT's 10-digit random nonce */
    nonce: string;
}
