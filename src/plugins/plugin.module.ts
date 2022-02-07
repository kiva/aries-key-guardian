import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { PluginFactory } from './plugin.factory';
import { RemoteModule } from '../remote/remote.module';
import { TokenModule } from '../token/token.module';
import { DbModule } from '../db/db.module';

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
