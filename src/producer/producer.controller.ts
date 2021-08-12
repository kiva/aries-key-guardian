import { Controller, Get } from '@nestjs/common';
import { Client, ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from '../kafkaConfig';
import { Observable } from 'rxjs';

@Controller('/produce')
export class ProducerController {

    @Client(kafkaConfig)
    client: ClientKafka;
    private static TOPIC_NAME: string = 'escrow-create';

    async onModuleInit() {
        this.client.subscribeToResponseOf(ProducerController.TOPIC_NAME);
        await this.client.connect();
    }

    @Get()
    produce(): Observable<any> {
        return this.client.send(ProducerController.TOPIC_NAME, {'id': 1, 'foo': 'bar'});
    }
}
