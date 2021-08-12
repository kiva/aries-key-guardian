import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { DatadogLogger } from 'protocol-common/datadog.logger';
import { Logger } from 'protocol-common/logger';
import { Constants } from 'protocol-common/constants';

export class ProducerService {

    /**
     * Sets up app in a way that can be used by main.ts and e2e tests
     */
    public static async setup(app: INestApplication): Promise<void> {
        const logger = new Logger(DatadogLogger.getLogger());
        app.useLogger(logger);

        app.useGlobalFilters(new ProtocolExceptionFilter());

        if (process.env.NODE_ENV === Constants.LOCAL) {
            // Set up internal documentation at /api
            const options = new DocumentBuilder()
                .setTitle('Aries Key Guardian Producer')
                .setDescription('Internal Documentation for the Aries Key Guardian microservice')
                .setVersion('1.0')
                .build();
            const document = SwaggerModule.createDocument(app, options);
            SwaggerModule.setup('api-docs', app, document);
        }
    }
}
