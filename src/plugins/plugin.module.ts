import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module.js';
import { PluginFactory } from './plugin.factory.js';
import { RemoteModule } from '../remote/remote.module.js';
import { TokenModule } from '../token/token.module.js';
import { DbModule } from '../db/db.module.js';

/**
 * Module for our different authentication plugins
 */
@Module({
    imports: [
        DbModule,
        RemoteModule,
        SmsModule,
        TokenModule
    ],
    providers: [PluginFactory],
    exports: [PluginFactory],
})
export class PluginModule {}
