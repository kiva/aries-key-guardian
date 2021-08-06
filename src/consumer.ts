import { NestFactory } from '@nestjs/core';
import { ConsumerModule } from './consumer/consumer.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { kafkaConfig } from './kafkaConfig';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ConsumerModule, kafkaConfig);
  app.listenAsync();
}
bootstrap();