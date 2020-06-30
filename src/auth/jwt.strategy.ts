import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AES, enc } from 'crypto-js';
import { AuthService } from './auth.service';
import { JwtPayload } from './jwt-payload.interface';
import { HttpConstants } from '@kiva/protocol-common/http-context/http.constants';

/**
 * Jwt Strategy based on [PassportJS]{@link http://passportjs.org/}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    /**
     * Parses a [[JwtToken]] into the *'PassportStrategy'
     * The JWT token is provided in an HTTP `x-jwt-auth` header
     */
    constructor(private readonly authService: AuthService) {
        super({
        jwtFromRequest: ExtractJwt.fromHeader(HttpConstants.JWT_AUTH_HEADER),
        secretOrKey: AuthService.parsePemKey(process.env.JWT_PUBLIC_SIGNING_KEY),
        algorithms: ['ES256'],
        issuer: 'kiva',
        });
    }



    /**
     * Validates a provided jwt - this is only used for authenticated actions against the auth server itself (eg delete wallet credentials)
     */
    async validate(payload: any, done: (...args: any[]) => void) {
        try {
        const bytes = AES.decrypt(payload.payload, process.env.JWT_ENCRYPTION_KEY);
        const decrypted: JwtPayload = JSON.parse(bytes.toString(enc.Utf8));
        await this.authService.validateToken(decrypted);
        done(null, decrypted);
        } catch (e) {
        throw new UnauthorizedException('Invalid token');
        }
    }
}
