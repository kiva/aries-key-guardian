import { Controller, Get, Post, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateConsumerDto } from './create-consumer.dto';
import { Client, ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from '../kafkaConfig';

@Controller('posts')
export class ConsumerController {
    @MessagePattern('escrow-create')
    getKafka(@Payload() message) {
        console.log(message.value);
        return 'Hello World';
    }
    
    @Get()
    getPosts() {
        let posts = {
            id: 1,
            foo: "bar"
        }
        return posts;
    }

    @Post()
    create(@Body() createConsumerDto: CreateConsumerDto){
        console.log(createConsumerDto);
        return createConsumerDto;
    }

    @Client(kafkaConfig)
    client: ClientKafka
}
