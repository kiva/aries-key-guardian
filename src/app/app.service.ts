import { Injectable, INestApplication, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import bodyParser from 'body-parser';
import { ServiceReportDto } from './dtos/service.report.dto.js';
import { Constants, HttpConstants, ProtocolExceptionFilter, ProtocolLogger, traceware } from 'protocol-common';

/**
 * All external traffic will be routed through gateway so no need for things like rate-limiting here
 */
@Injectable()
export class AppService {
    private static startedAt: Date;

    /**
     * Sets up app in a way that can be used by main.ts and e2e tests
     */
    public static setup(app: INestApplication): void {
        const logger = new Logger(app.get(ProtocolLogger));
        app.useLogger(logger);
        app.use(traceware(process.env.SERVICE_NAME));
        app.useGlobalFilters(new ProtocolExceptionFilter());

        AppService.startedAt = new Date();

        // Increase json parse size to handle encoded images
        app.use(bodyParser.json({ limit: HttpConstants.JSON_LIMIT }));

        if (process.env.NODE_ENV === Constants.LOCAL) {
            // Set up internal documentation at /api
            const options = new DocumentBuilder()
                .setTitle('Aries Key Guardian')
                .setDescription('Internal Documentation for the Aries Key Guardian microservice')
                .setVersion('1.0')
                .build();
            const document = SwaggerModule.createDocument(app, options);
            SwaggerModule.setup('api-docs', app, document);
        }
    }

    public async generateStatsReport(): Promise<ServiceReportDto> {
        Logger.log('stats report generated');
        const report: ServiceReportDto = new ServiceReportDto();
        report.serviceName = process.env.SERVICE_NAME;
        report.startedAt = AppService.startedAt.toDateString();
        report.currentTime = new Date().toDateString();
        report.versions = ['none'];

        // TODO: once we determine which items we want to check versions on
        return Promise.resolve(report);
    }
}
