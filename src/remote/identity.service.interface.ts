export abstract class IIdentityService {
    abstract async verifyFingerprint(position: number, image: string, filters: any): Promise<any>;
    abstract async verifyFingerprintTemplate(position: number, template: string, filters: any): Promise<any>;
    abstract async templatize(data: any): Promise<any>;
    abstract async qualityCheck(filters: any): Promise<any>;
}
