export abstract class IBioAuthService {
    abstract verifyFingerprint(position: number, image: string, dids: string): Promise<any>;
    abstract verifyFingerprintTemplate(position: number, template: string, dids: string): Promise<any>;
    abstract templatize(data: any): Promise<any>;
    abstract qualityCheck(dids: string): Promise<any>;
}
