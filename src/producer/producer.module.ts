import { Module } from '@nestjs/common';
import { ProducerController } from './producer.controller';
import { ConfigModule } from 'protocol-common/config.module';
import data from '../config/env.json';

@Module({
    imports: [ConfigModule.init(data)],
    controllers: [ProducerController],
})
export class  ProducerModule {}
