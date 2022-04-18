import { Get, Controller } from '@nestjs/common';
import { HttpConstants } from 'protocol-common/http-context/http.constants';
import { DisableAutoLogging } from 'protocol-common/disable.auto.logging.decorator';
import { AppService } from './app.service';
import { ServiceReportDto } from './dtos/service.report.dto';

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
     * For the uptime statists report (see Uptime feature brief)
     */
    @Get('stats')
    async generateStatsReport() : Promise<ServiceReportDto> {
        return await this.service.generateStatsReport();
    }
}
