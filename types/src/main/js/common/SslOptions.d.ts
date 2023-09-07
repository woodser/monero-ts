export = SslOptions;
/**
 * SSL options for remote endpoints.
 */
declare class SslOptions {
    constructor(state: any);
    state: any;
    getPrivateKeyPath(): any;
    setPrivateKeyPath(privateKeyPath: any): this;
    getCertificatePath(): any;
    setCertificatePath(certificatePath: any): this;
    getCertificateAuthorityFile(): any;
    setCertificateAuthorityFile(certificateAuthorityFile: any): this;
    getAllowedFingerprints(): any;
    setAllowedFingerprints(allowedFingerprints: any): this;
    getAllowAnyCert(): any;
    setAllowAnyCert(allowAnyCert: any): this;
}
