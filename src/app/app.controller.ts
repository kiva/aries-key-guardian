import { Get, Controller } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ServiceReportDto } from './dtos/service.report.dto.js';
import { DisableAutoLogging, HttpConstants } from 'protocol-common';

/**
 * Base route is just for various health check endpoints
 */
@DisableAutoLogging()
@Controller()
export class AppController {

    constructor(private readonly service: AppService) {
    }

    @Get()
    base(): string {
        return process.env.SERVICE_NAME;
    }

    @Get('ping')
    ping(): string {
        return HttpConstants.PING_RESPONSE;
    }

    @Get('healthz')
    healthz(): string {
        return HttpConstants.HEALTHZ_RESPONSE;
    }

    /**
     * For the uptime statistics report (see Uptime feature brief)
     */
    @Get('stats')
    async generateStatsReport() : Promise<ServiceReportDto> {
        return await this.service.generateStatsReport();
    }
}
