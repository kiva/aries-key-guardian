import { IExternalControllerService } from '../../src/remote/external.controller.service.interface';

export class MockExternalControllerService implements IExternalControllerService {
    public async callExternalWalletCreate(id: string): Promise<string> {
        return 'success';
    }
}
