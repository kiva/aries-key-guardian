
export abstract class IExternalControllerService {
    abstract callExternalWalletCreate(identityNumber: string): Promise<string>;
}
