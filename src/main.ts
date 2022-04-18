import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppService } from './app/app.service';
import { Logger } from 'protocol-common/logger';

const bootstrap = async () => {
  const port = process.env.PORT;
  const app = await NestFactory.create(AppModule);

  AppService.setup(app);
  await app.listen(port);
  Logger.log(`Server started on ${port}`);
};

bootstrap().catch(e => {
    Logger.error(e.message);
});
