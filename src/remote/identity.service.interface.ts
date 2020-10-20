export abstract class IIdentityService {
    abstract async verify(position: number, image: string, filters: any): Promise<any>;
    abstract async templatize(data: any): Promise<any>;
    abstract async qualityCheck(filters: any): Promise<any>;
}
