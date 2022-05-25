import { OnboardResponseDto } from './dto/onboard.response.dto.js';

export abstract class IExternalControllerService {
    abstract callExternalWalletCreate(id: string): Promise<OnboardResponseDto>;
}
