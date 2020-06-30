import { Module } from '@nestjs/common';
import { ConfigModule } from '@kiva/protocol-common/config.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AuthModule } from '../auth/auth.module';
import { OrmConfig } from '../ormconfig';
import { RequestContextModule } from '@kiva/protocol-common/http-context/request.context.module';
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
        AuthModule,
        EscrowModule,
        OrmConfig(),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
