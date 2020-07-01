import { Module, HttpModule } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { PluginFactory } from './plugin.factory';

/**
 * Module for our different authentication plugins
 */
@Module({
    imports: [
        HttpModule,
        SmsModule,
    ],
    providers: [PluginFactory],
    exports: [PluginFactory],
})
export class PluginModule {}
