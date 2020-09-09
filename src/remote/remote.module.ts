import { HttpModule, Module } from '@nestjs/common';
import { IdentityService } from './impl/identity.service';
import { AgencyService } from './impl/agency.service';
import { IIdentityService } from './identity.service.interface';
import { IAgencyService } from './agency.service.interface';
import { TwillioService } from './impl/twillio.service';
import { ITwillioService } from './twillio.service.interface';

@Module({
    imports: [HttpModule],
    providers: [{
        provide: IIdentityService,
        useClass: IdentityService
    }, {
        provide: IAgencyService,
        useClass: AgencyService
    }, {
        provide: ITwillioService,
        useClass: TwillioService
    }],
    exports: [IIdentityService, IAgencyService, ITwillioService]
})
export class RemoteModule {}
