import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { PluginFactory } from './plugin.factory';
import { RemoteModule } from '../remote/remote.module';

/**
 * Module for our different authentication plugins
 */
@Module({
    imports: [
        RemoteModule,
        SmsModule,
    ],
    providers: [PluginFactory],
    exports: [PluginFactory],
})
export class PluginModule {}
