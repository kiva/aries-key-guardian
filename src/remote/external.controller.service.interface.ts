import { OnboardResponseDto } from './dto/onboard.response.dto';

export abstract class IExternalControllerService {
    abstract callExternalWalletCreate(id: string): Promise<OnboardResponseDto>;
}
