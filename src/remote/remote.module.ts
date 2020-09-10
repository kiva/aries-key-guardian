import { HttpModule, Module } from '@nestjs/common';
import { IdentityService } from './impl/identity.service';
import { AgencyService } from './impl/agency.service';
import { IIdentityService } from './identity.service.interface';
import { IAgencyService } from './agency.service.interface';
import { SmsTwillioService } from './impl/sms.twillio.service';
import { ISmsService } from './sms.service.interface';
import { SmsDisabledService } from './impl/sms.disabled.service';

@Module({
    imports: [HttpModule],
    providers: [{
        provide: IIdentityService,
        useClass: IdentityService
    }, {
        provide: IAgencyService,
        useClass: AgencyService
    }, {
        provide: ISmsService,
        useClass: process.env.TWILLIO_ENABLED === 'true' ? SmsTwillioService : SmsDisabledService
    }],
    exports: [IIdentityService, IAgencyService, ISmsService]
})
export class RemoteModule {}
