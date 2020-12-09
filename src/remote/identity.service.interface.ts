export abstract class IIdentityService {
    abstract verifyFingerprint(position: number, image: string, filters: any): Promise<any>;
    abstract verifyFingerprintTemplate(position: number, template: string, filters: any): Promise<any>;
    abstract templatize(data: any): Promise<any>;
    abstract qualityCheck(filters: any): Promise<any>;
}
