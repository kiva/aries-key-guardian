import { Module } from '@nestjs/common';
import { BioAuthService } from './impl/bio.auth.service.js';
import { AgencyService } from './impl/agency.service.js';
import { IBioAuthService } from './bio.auth.service.interface.js';
import { IAgencyService } from './agency.service.interface.js';
import { SmsTwillioService } from './impl/sms.twillio.service.js';
import { ISmsService } from './sms.service.interface.js';
import { SmsDisabledService } from './impl/sms.disabled.service.js';
import { IJwksService } from './jwks.service.interface.js';
import { JwksService } from './impl/jwks.service.js';
import { IExternalControllerService } from './external.controller.service.interface.js';
import { ExternalControllerService } from './impl/external.controller.service.js';
import { ProtocolHttpModule } from 'protocol-common';

@Module({
    imports: [ProtocolHttpModule],
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
