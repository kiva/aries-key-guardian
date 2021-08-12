import { NestFactory } from '@nestjs/core';
import { Logger } from 'protocol-common/logger';
import { ProducerModule } from './producer/producer.module';
import { ProducerService } from './producer/producer.service';

async function bootstrap() {
    const port = process.env.PRODUCER_PORT;
    const app = await NestFactory.create(ProducerModule);

    await ProducerService.setup(app);
    await app.listen(port);
    Logger.log(`Server started on ${port}`);
}
bootstrap();
