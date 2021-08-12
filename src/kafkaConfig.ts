import { KafkaOptions, Transport } from '@nestjs/microservices';

export const kafkaConfig: KafkaOptions = {
    transport: Transport.KAFKA,
    options:{
        client: {
            clientId: 'post',
            brokers: ['kafka:9092'],
        },
        consumer: {
            groupId: 'post-consumer',
            allowAutoTopicCreation: true,
        },
    }
};
