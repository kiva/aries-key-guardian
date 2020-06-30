import { Module, HttpModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { WalletCredentials } from '../entity/wallet.credentials';
import { PluginModule } from '../plugins/plugin.module';

/**
 * Configures and registers Nest's JWT Functionality
 * We use ES256 since ECDSA provides smaller more secure tokens, and use 256 since that's the most common for JWT
 * TODO there is some overlap here between auth modules in the auth server and identity wallet server, not sure the best way to make DRY
 */
@Module({
    imports: [
        JwtModule.registerAsync({ useFactory: () => AuthService.getConfig() } ),
        TypeOrmModule.forFeature([WalletCredentials]),
        HttpModule,
        PluginModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
