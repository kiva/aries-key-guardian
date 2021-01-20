export abstract class IIdentityService {
    abstract verifyFingerprint(position: number, image: string, did: string): Promise<any>;
    abstract verifyFingerprintTemplate(position: number, template: string, did: string): Promise<any>;
    abstract templatize(data: any): Promise<any>;
    abstract qualityCheck(id: string): Promise<any>;
}
