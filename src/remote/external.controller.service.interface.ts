import { ExternalId } from '../db/entity/external.id';

export abstract class IExternalControllerService {
    abstract callExternalWalletCreate(externalIds: ExternalId[]): Promise<string>;
}
