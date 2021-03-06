import { Module } from '@nestjs/common';
import { ConfigModule } from 'protocol-common/config.module';
import { RequestContextModule } from 'protocol-common/http-context/request.context.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { OrmConfig } from '../ormconfig';
import data from '../config/env.json';
import { EscrowModule } from '../escrow/escrow.module';
import { RateLimitModule } from '../ratelimit/ratelimit.module';
import { DbModule } from '../db/db.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'protocol-common/logging.interceptor';

/**
 * Initializes the Nest application
 * Using TypeOrmModule forRoot which loads the database credentials from ormconfig.json, could also use env variables here
 */
@Module({
    imports: [
        ConfigModule.init(data),
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
