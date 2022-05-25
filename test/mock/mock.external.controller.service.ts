import { IExternalControllerService } from '../../dist/remote/external.controller.service.interface.js';
import { OnboardResponseDto } from '../../dist/remote/dto/onboard.response.dto.js';

export class MockExternalControllerService implements IExternalControllerService {

    constructor(private readonly agentId: string) {}

    public async callExternalWalletCreate(): Promise<OnboardResponseDto> {
        return Promise.resolve({
            success: true,
            agentId: this.agentId
        });
    }
}
