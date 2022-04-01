/* eslint-disable @typescript-eslint/no-unused-vars */
import { IExternalControllerService } from '../../src/remote/external.controller.service.interface';
import { OnboardResponseDto } from '../../src/remote/dto/onboard.response.dto';

export class MockExternalControllerService implements IExternalControllerService {

    constructor(private readonly agentId: string) {}

    public async callExternalWalletCreate(id: string): Promise<OnboardResponseDto> {
        return Promise.resolve({
            success: true,
            agentId: this.agentId
        });
    }
}
