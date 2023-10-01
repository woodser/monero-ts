/**
 * SSL options for remote endpoints.
 */
export default class SslOptions {
    privateKeyPath: string;
    certificatePath: string;
    certificateAuthorityFile: string;
    allowedFingerprints: string[];
    allowAnyCert: boolean;
    constructor(options?: Partial<SslOptions>);
    getPrivateKeyPath(): string;
    setPrivateKeyPath(privateKeyPath: any): this;
    getCertificatePath(): string;
    setCertificatePath(certificatePath: any): this;
    getCertificateAuthorityFile(): string;
    setCertificateAuthorityFile(certificateAuthorityFile: any): this;
    getAllowedFingerprints(): string[];
    setAllowedFingerprints(allowedFingerprints: any): this;
    getAllowAnyCert(): boolean;
    setAllowAnyCert(allowAnyCert: any): this;
}
