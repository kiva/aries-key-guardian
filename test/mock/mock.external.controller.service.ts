import { IExternalControllerService } from '../../src/remote/external.controller.service.interface';

export class MockExternalControllerService implements IExternalControllerService {
    public async callExternalWalletCreate(identityNumber: string): Promise<string> {
        return 'success';
    }
}
