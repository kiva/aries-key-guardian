import { Module } from '@nestjs/common';
import { BioAuthService } from './impl/bio.auth.service';
import { AgencyService } from './impl/agency.service';
import { IBioAuthService } from './bio.auth.service.interface';
import { IAgencyService } from './agency.service.interface';
import { SmsTwillioService } from './impl/sms.twillio.service';
import { ISmsService } from './sms.service.interface';
import { SmsDisabledService } from './impl/sms.disabled.service';
import { IJwksService } from './jwks.service.interface';
import { JwksService } from './impl/jwks.service';
import { IExternalControllerService } from './external.controller.service.interface';
import { ExternalControllerService } from './impl/external.controller.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    providers: [{
        provide: IBioAuthService,
        useClass: BioAuthService
    }, {
        provide: IAgencyService,
        useClass: AgencyService
    }, {
        provide: ISmsService,
        useClass: process.env.TWILLIO_ENABLED === 'true' ? SmsTwillioService : SmsDisabledService
    }, {
        provide: IJwksService,
        useClass: JwksService
    }, {
        provide: IExternalControllerService,
        useClass: ExternalControllerService
    }],
    exports: [IBioAuthService, IAgencyService, ISmsService, IJwksService, IExternalControllerService]
})
export class RemoteModule {}
