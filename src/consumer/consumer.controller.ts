import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Client, ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from '../kafkaConfig';
import { Logger } from 'protocol-common/logger';

@Controller('posts')
export class ConsumerController {
    @MessagePattern('escrow-create')
    getKafka(@Payload() message) {
        Logger.log(message.value);
        return 'Hello World';
    }

    @Client(kafkaConfig)
    client: ClientKafka
}
