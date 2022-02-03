import { IExternalControllerService } from '../../src/remote/external.controller.service.interface';
import { ExternalId } from '../../src/db/entity/external.id';

export class MockExternalControllerService implements IExternalControllerService {
    public async callExternalWalletCreate(externalIds: ExternalId[]): Promise<string> {
        return 'success';
    }
}
