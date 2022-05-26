import { Module } from '@nestjs/common';
import { EscrowService } from './escrow.service.js';
import { EscrowController } from './escrow.controller.js';
import { PluginModule } from '../plugins/plugin.module.js';
import { RemoteModule } from '../remote/remote.module.js';
import { DbModule } from '../db/db.module.js';

/**
 * For now keeping the escrow module as part of the AuthService, but eventually this will be moved to it's own Escrow System repo
 */
@Module({
    imports: [
        DbModule,
        PluginModule,
        RemoteModule
    ],
    controllers: [EscrowController],
    providers: [EscrowService],
})
export class EscrowModule {}
