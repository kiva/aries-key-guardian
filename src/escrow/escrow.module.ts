import { Module } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletCredentials } from '../entity/wallet.credentials';
import { PluginModule } from '../plugins/plugin.module';

/**
 * For now keeping the escrow module as part of the AuthService, but eventually this will be moved to it's own Escrow System repo
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([WalletCredentials]),
        PluginModule,
    ],
    controllers: [EscrowController],
    providers: [EscrowService],
})
export class EscrowModule {}
