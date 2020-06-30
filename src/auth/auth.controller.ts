import { Controller, Body, Post, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtToken } from './jwtToken.interface';
import { WalletCredentialsDto } from './wallet.credentials.dto';
import { FingerprintAuthDto } from './fingerprint.auth.dto';
import { SimpleTokenDto } from './simple.token.dto';
import { DeviceValidationPipe } from './device.validation.pipe';
import { V1Uri } from '../V1Uri';
import { ProtocolValidationPipe } from '@kiva/protocol-common/protocol.validation.pipe';
import { DidDto } from './did.dto';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';

/**
 * Serves authentication tokens to be used for authenticating user actions
 */
@ApiTags('auth')
@Controller(V1Uri.AUTH)
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    /**
     * Get an authentication token using wallet id & key
     * The endpoint is useful getting tokens to perform automated tasks, eg Steward token, and should never be exposed publicly
     * TODO we probably want some stricter controls on usage of this endpoint
     */
    @Post(V1Uri.AUTH_TOKEN)
    async generateToken(@Body(new ProtocolValidationPipe()) body: SimpleTokenDto): Promise<JwtToken> {
        return await this.authService.generateToken(body.id, body.key, body.did);
    }

    /**
     * Stores the did, walletId, walletKey and seed, and returns a token
     * TODO we should limit credential creation here only to admins (ie the syncer process)
     */
    @Post(V1Uri.AUTH_CREDENTIAL_TOKEN)
    async saveWalletCredentials(@Body(new ProtocolValidationPipe()) body: WalletCredentialsDto): Promise<JwtToken> {
        return await this.authService.saveWalletCredentials(body.did, body.walletId, body.walletKey, body.seed);
    }

    /**
     * Deletes wallet credentials by did, only really used in a rollback event during wallet creation
     * TODO we should limit to admins
     */
    @Delete(V1Uri.AUTH_CREDENTIALS)
    async deleteWalletCredentials(@Body(new ProtocolValidationPipe()) body: DidDto): Promise<void> {
        return await this.authService.deleteWalletCredentials(body.did);
    }

    /**
     * This is the main fingerprint endpoint that is exposed to the public via the api gateway, where we force wallet creation on the spot
     * so that we can guarantee an access token
     */
    @Post(V1Uri.AUTH_FINGERPRINT)
    async generateTokenFromFingerprint(@Body(new ProtocolValidationPipe(), new DeviceValidationPipe()) body: FingerprintAuthDto): Promise<JwtToken> {
        return await this.authService.generateTokenFromFingerprint(body.position, body.filters, body.image);
    }

    /**
     * This endpoint has 2 stages, the first is just sending the SMS and replying with the sent status
     * The second is verifying the OTP and if this happens then the token in generated and returned
     */
    @Post(V1Uri.AUTH_SMS)
    async generateTokenFromSmsOtp(@Body(new ProtocolValidationPipe()) body: any): Promise<any> {
        return await this.authService.handleSmsOtpAuth(body.filters, body.phoneNumber, body.otp);
    }

    /**
     * This is means of getting authorization for the citizen so what we can create/recreate wallet credentials on
     * behalf of the citizen.  This endpoint should never be exposed in the gateway.
     * TODO: beef up security.
     */
    @Post(V1Uri.AUTH_DETAILS_BY_DID)
    async getWalletDetailsFromDid(@Body(new ProtocolValidationPipe()) body: DidDto): Promise<string> {
        return await this.authService.getWalletDetailsFromDid(body.did);
    }

    /**
     * Internal endpoint to check if a given DID exists in the db
     */
    @Post(V1Uri.AUTH_EXISTS)
    async exists(@Body(new ProtocolValidationPipe()) body: DidDto): Promise<any> {
        const exists = await this.authService.didExists(body.did);
        return { exists };
    }
}
