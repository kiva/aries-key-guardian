export abstract class IExternalControllerService {
    abstract callExternalWalletCreate(id: string): Promise<string>;
}
