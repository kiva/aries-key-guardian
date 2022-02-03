import { HttpModule, Module } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { PluginModule } from '../plugins/plugin.module';
import { RemoteModule } from '../remote/remote.module';
import { DbModule } from '../db/db.module';

/**
 * For now keeping the escrow module as part of the AuthService, but eventually this will be moved to it's own Escrow System repo
 */
@Module({
    imports: [
        DbModule,
        PluginModule,
        RemoteModule,
        HttpModule
    ],
    controllers: [EscrowController],
    providers: [EscrowService],
})
export class EscrowModule {}
