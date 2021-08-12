import { Body, Controller, Post } from '@nestjs/common';
import { Client, ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from '../kafkaConfig';
import { Observable } from 'rxjs';
import { ProtocolValidationPipe } from 'protocol-common/validation/protocol.validation.pipe';
import { CreateDto } from '../escrow/dto/create.dto';

@Controller('/produce')
export class ProducerController {

    @Client(kafkaConfig)
    client: ClientKafka;
    private static TOPIC_NAME: string = 'escrow-create';

    async onModuleInit() {
        this.client.subscribeToResponseOf(ProducerController.TOPIC_NAME);
        await this.client.connect();
    }

    @Post()
    produce(@Body(new ProtocolValidationPipe()) body: CreateDto): Observable<any> {
        return this.client.send(ProducerController.TOPIC_NAME, body);
    }
}
