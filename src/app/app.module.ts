import { Module } from '@nestjs/common';
import { ConfigModule } from 'protocol-common/config.module';
import { RequestContextModule } from 'protocol-common/http-context/request.context.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { OrmConfig } from '../ormconfig';
import data from '../config/env.json';
import { EscrowModule } from '../escrow/escrow.module';

/**
 * Initializes the Nest application
 * Using TypeOrmModule forRoot which loads the database credentials from ormconfig.json, could also use env variables here
 */
@Module({
    imports: [
        ConfigModule.init(data),
        RequestContextModule,
        EscrowModule,
        OrmConfig(),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
