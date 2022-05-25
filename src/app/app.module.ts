import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { OrmConfig } from '../ormconfig.js';
import { EscrowModule } from '../escrow/escrow.module.js';
import { RateLimitModule } from '../ratelimit/ratelimit.module.js';
import { DbModule } from '../db/db.module.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, LoggingInterceptor, ProtocolLoggerModule, RequestContextModule } from 'protocol-common';

// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import data from '../config/env.json' assert { type: 'json'};

/**
 * Initializes the Nest application
 * Using TypeOrmModule forRoot which loads the database credentials from ormconfig.json, could also use env variables here
 */
@Module({
    imports: [
        ConfigModule.init(data),
        ProtocolLoggerModule,
        DbModule,
        RateLimitModule,
        RequestContextModule,
        EscrowModule,
        OrmConfig(),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor
        }
    ],
})
export class AppModule {}
