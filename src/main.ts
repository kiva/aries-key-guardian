import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppService } from './app/app.service';
import { Logger } from '@kiva/protocol-common/logger';

async function bootstrap() {
  const port = process.env.PORT;
  const app = await NestFactory.create(AppModule);

  await AppService.setup(app);
  await app.listen(port);
  Logger.log(`Server started on ${port}`);
}
bootstrap();
