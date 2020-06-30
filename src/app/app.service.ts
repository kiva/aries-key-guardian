import { Injectable, INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'body-parser';
import { ProtocolExceptionFilter } from '@kiva/protocol-common/protocol.exception.filter';
import { LoggingInterceptor } from '@kiva/protocol-common/logging.interceptor';
import { DatadogLogger } from '@kiva/protocol-common/datadog.logger';
import { Logger } from '@kiva/protocol-common/logger';
import { traceware } from '@kiva/protocol-common/tracer';
import { HttpConstants } from '@kiva/protocol-common/http-context/http.constants';
import { Constants } from '@kiva/protocol-common/constants';

/**
 * The Root Application Service
 */
@Injectable()
export class AppService {

    /**
     * Sets up app in a way that can be used by main.ts and e2e tests
     */
    public static async setup(app: INestApplication): Promise<void> {
        const logger = new Logger(DatadogLogger.getLogger());
        app.useLogger(logger);
        app.use(traceware('auth'));

        app.useGlobalInterceptors(new LoggingInterceptor());
        app.useGlobalFilters(new ProtocolExceptionFilter());

        // Increase json parse size to handle encoded images
        app.use(json({ limit: HttpConstants.JSON_LIMIT }));

        if (process.env.NODE_ENV === Constants.LOCAL) {
            // Set up internal documentation at /api
            const options = new DocumentBuilder()
                .setTitle('Auth Service')
                .setDescription('Internal Documentation for the Auth microservice')
                .setVersion('1.0')
                .build();
            const document = SwaggerModule.createDocument(app, options);
            SwaggerModule.setup('api-docs', app, document);
        }
    }
}
